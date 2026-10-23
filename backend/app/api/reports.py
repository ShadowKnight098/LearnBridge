import io
import csv
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_teacher, require_admin, verify_student_ownership
from app.models import (
    User, Class, ClassStudent, Mastery, Attempt, Question, Skill,
    StudentProfile, Alert, Session, UserRole
)
from app.schemas.reports import (
    ClassReportResponse, HeatmapCell, MostMissedQuestion,
    StudentReportResponse, AlertResponse, SchoolReportResponse
)

router = APIRouter(tags=["Reports & Analytics"])


@router.get("/teacher/reports/class/{class_id}", response_model=ClassReportResponse)
async def get_class_report(
    class_id: str,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    # REP-02: Verify teacher owns class
    cls_stmt = select(Class).where(Class.id == class_id)
    cls = (await db.execute(cls_stmt)).scalar_one_or_none()
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if cls.teacher_id != current_teacher.id and current_teacher.role != UserRole.admin.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access report for another teacher's class")

    # Get students in class
    students_stmt = select(User).join(ClassStudent, ClassStudent.student_id == User.id).where(
        ClassStudent.class_id == class_id
    )
    students = (await db.execute(students_stmt)).scalars().all()
    student_ids = [s.id for s in students]
    student_map = {s.id: s.name for s in students}

    if not student_ids:
        return ClassReportResponse(
            class_id=cls.id,
            class_name=cls.name,
            total_students=0,
            class_accuracy_percent=0.0,
            skill_averages={},
            heatmap=[],
            most_missed_questions=[],
            at_risk_student_ids=[]
        )

    # REP-01: Calculate class overall accuracy from attempts
    attempts_stmt = select(Attempt).where(Attempt.student_id.in_(student_ids))
    attempts = (await db.execute(attempts_stmt)).scalars().all()
    total_attempts = len(attempts)
    correct_attempts = sum(1 for a in attempts if a.is_correct)
    class_accuracy = round((correct_attempts / max(1, total_attempts)) * 100, 1) if total_attempts > 0 else 0.0

    # REP-03: Heatmap (students x skills)
    masteries_stmt = select(Mastery).where(Mastery.student_id.in_(student_ids))
    masteries = (await db.execute(masteries_stmt)).scalars().all()

    heatmap_cells: List[HeatmapCell] = []
    skill_totals: Dict[str, List[float]] = {}
    student_weak_counts: Dict[str, int] = {s_id: 0 for s_id in student_ids}

    for m in masteries:
        band = 1 if m.score < 0.40 else (2 if m.score < 0.70 else 3)
        heatmap_cells.append(HeatmapCell(
            student_id=m.student_id,
            student_name=student_map.get(m.student_id, "Student"),
            skill_id=m.skill_id,
            mastery_score=round(m.score, 3),
            band=band
        ))
        skill_totals.setdefault(m.skill_id, []).append(m.score)
        if m.score < 0.40:
            student_weak_counts[m.student_id] += 1

    skill_averages = {
        s_id: round(sum(scores) / len(scores), 3)
        for s_id, scores in skill_totals.items()
    }

    # At-risk students (>= 3 weak skills)
    at_risk_student_ids = [
        s_id for s_id, count in student_weak_counts.items() if count >= 3
    ]

    # REP-04: Most-missed questions
    question_stats: Dict[str, Dict[str, Any]] = {}
    for a in attempts:
        q_entry = question_stats.setdefault(a.question_id, {"total": 0, "wrong": 0})
        q_entry["total"] += 1
        if not a.is_correct:
            q_entry["wrong"] += 1

    most_missed: List[MostMissedQuestion] = []
    if question_stats:
        q_ids = list(question_stats.keys())
        q_objs = (await db.execute(select(Question).where(Question.id.in_(q_ids)))).scalars().all()
        q_obj_map = {q.id: q for q in q_objs}

        for q_id, counts in question_stats.items():
            if counts["total"] > 0 and q_id in q_obj_map:
                q = q_obj_map[q_id]
                miss_rate = round((counts["wrong"] / counts["total"]) * 100, 1)
                most_missed.append(MostMissedQuestion(
                    question_id=q.id,
                    text=q.text[:80] + ("..." if len(q.text) > 80 else ""),
                    skill_id=q.skill_id,
                    total_attempts=counts["total"],
                    wrong_attempts=counts["wrong"],
                    miss_rate_percent=miss_rate
                ))
        most_missed.sort(key=lambda x: (x.miss_rate_percent, x.wrong_attempts), reverse=True)

    return ClassReportResponse(
        class_id=cls.id,
        class_name=cls.name,
        total_students=len(students),
        class_accuracy_percent=class_accuracy,
        skill_averages=skill_averages,
        heatmap=heatmap_cells,
        most_missed_questions=most_missed[:5],
        at_risk_student_ids=at_risk_student_ids
    )


@router.get("/teacher/reports/class/{class_id}/export/csv")
async def export_class_csv(
    class_id: str,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    cls = await db.get(Class, class_id)
    if not cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if cls.teacher_id != current_teacher.id and current_teacher.role != UserRole.admin.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    students_stmt = select(User).join(ClassStudent, ClassStudent.student_id == User.id).where(
        ClassStudent.class_id == class_id
    )
    students = (await db.execute(students_stmt)).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Student ID", "Name", "Username", "Language", "Total Attempts", "Accuracy %"])

    for s in students:
        s_attempts = (await db.execute(select(Attempt).where(Attempt.student_id == s.id))).scalars().all()
        t_count = len(s_attempts)
        c_count = sum(1 for a in s_attempts if a.is_correct)
        acc = round((c_count / max(1, t_count)) * 100, 1) if t_count > 0 else 0.0
        writer.writerow([s.id, s.name, s.username, s.language, t_count, acc])

    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=class_{cls.name.replace(' ', '_')}_report.csv"}
    )


@router.get("/teacher/reports/student/{student_id}", response_model=StudentReportResponse)
async def get_student_report(
    student_id: str,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    student = await verify_student_ownership(student_id, current_teacher, db)

    prof = (await db.execute(select(StudentProfile).where(StudentProfile.student_id == student.id))).scalar_one_or_none()
    attempts = (await db.execute(select(Attempt).where(Attempt.student_id == student.id))).scalars().all()
    masteries = (await db.execute(select(Mastery).where(Mastery.student_id == student.id))).scalars().all()

    total_attempts = len(attempts)
    correct_attempts = sum(1 for a in attempts if a.is_correct)
    flagged_attempts = sum(1 for a in attempts if a.flagged)
    accuracy = round((correct_attempts / max(1, total_attempts)) * 100, 1) if total_attempts > 0 else 0.0

    mastery_map = {m.skill_id: round(m.score, 3) for m in masteries}
    weak_skills = [m.skill_id for m in masteries if m.score < 0.40]
    strong_skills = [m.skill_id for m in masteries if m.score >= 0.70]

    return StudentReportResponse(
        student_id=student.id,
        student_name=student.name,
        language=student.language,
        xp=prof.xp if prof else 0,
        level=prof.level if prof else 1,
        current_streak=prof.current_streak if prof else 0,
        mastery=mastery_map,
        accuracy_percent=accuracy,
        total_attempts=total_attempts,
        flagged_attempts=flagged_attempts,
        weak_skills=weak_skills,
        strong_skills=strong_skills
    )


@router.get("/teacher/alerts", response_model=List[AlertResponse])
async def list_teacher_alerts(
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    try:
        stmt = select(Alert, User.name.label("student_name")).outerjoin(
            User, User.id == Alert.student_id
        ).where(
            Alert.teacher_id == current_teacher.id,
            Alert.resolved == False
        ).order_by(Alert.created_at.desc())

        rows = (await db.execute(stmt)).all()
        return [
            AlertResponse(
                id=alert.id,
                teacher_id=alert.teacher_id,
                student_id=alert.student_id,
                student_name=sname,
                kind=alert.kind,
                detail=alert.detail,
                resolved=alert.resolved,
                created_at=alert.created_at
            )
            for alert, sname in rows
        ]
    except Exception as exc:
        logger.warning(f"Failed to query teacher alerts: {exc}")
        return []


@router.patch("/teacher/alerts/{alert_id}/resolve", response_model=dict)
async def resolve_alert(
    alert_id: str,
    current_teacher: User = Depends(require_teacher),
    db: AsyncSession = Depends(get_db)
):
    alert = await db.get(Alert, alert_id)
    if not alert or alert.teacher_id != current_teacher.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found or unauthorized")

    alert.resolved = True
    await db.commit()
    return {"success": True, "message": "Alert marked resolved"}


@router.get("/admin/reports/school", response_model=SchoolReportResponse, dependencies=[Depends(require_admin)])
async def get_school_report(db: AsyncSession = Depends(get_db)):
    # REP-06: School comparison covers all classes
    classes = (await db.execute(select(Class))).scalars().all()
    teachers_count = (await db.execute(select(func.count(User.id)).where(User.role == "teacher"))).scalar() or 0
    students_count = (await db.execute(select(func.count(User.id)).where(User.role == "student"))).scalar() or 0
    sessions_count = (await db.execute(select(func.count(Session.id)).where(Session.ended_at.is_not(None)))).scalar() or 0

    all_attempts = (await db.execute(select(Attempt))).scalars().all()
    total_att = len(all_attempts)
    correct_att = sum(1 for a in all_attempts if a.is_correct)
    avg_accuracy = round((correct_att / max(1, total_att)) * 100, 1) if total_att > 0 else 0.0

    class_summaries = []
    for c in classes:
        st_count_stmt = select(func.count(ClassStudent.student_id)).where(ClassStudent.class_id == c.id)
        s_count = (await db.execute(st_count_stmt)).scalar() or 0
        class_summaries.append({
            "class_id": c.id,
            "class_name": c.name,
            "grade": c.grade,
            "teacher_id": c.teacher_id,
            "student_count": s_count
        })

    return SchoolReportResponse(
        total_classes=len(classes),
        total_teachers=teachers_count,
        total_students=students_count,
        total_sessions_completed=sessions_count,
        average_school_accuracy=avg_accuracy,
        class_summaries=class_summaries
    )

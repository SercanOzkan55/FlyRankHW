import json
import sys
from datetime import datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def main(input_file, output_file):
    payload = json.loads(Path(input_file).read_text(encoding="utf-8"))
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    summary = payload["summary"]
    generated = datetime.fromisoformat(payload["generatedAt"].replace("Z", "+00:00")).strftime("%Y-%m-%d %H:%M UTC")
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="ReportTitle", parent=styles["Title"], textColor=colors.HexColor("#123047"), spaceAfter=8))
    styles.add(ParagraphStyle(name="Muted", parent=styles["BodyText"], textColor=colors.HexColor("#52616B"), fontSize=9))
    doc = SimpleDocTemplate(output_file, pagesize=letter, rightMargin=.65*inch, leftMargin=.65*inch, topMargin=.65*inch, bottomMargin=.65*inch)
    story = [Paragraph("Task Summary Report", styles["ReportTitle"]), Paragraph(f"Generated {generated}. Source: PostgreSQL tasks table.", styles["Muted"]), Spacer(1, 18)]
    metrics = [["Total tasks", "Completed", "Open", "Completion rate"], [str(summary["totalTasks"]), str(summary["completedTasks"]), str(summary["openTasks"]), f'{summary["completionRate"]}%']]
    table = Table(metrics, colWidths=[1.65*inch]*4)
    table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#123047")), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("BACKGROUND", (0,1), (-1,1), colors.HexColor("#EAF3F7")), ("ALIGN", (0,0), (-1,-1), "CENTER"), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("GRID", (0,0), (-1,-1), .4, colors.HexColor("#C9D8DF")), ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9)]))
    story += [table, Spacer(1,18), Paragraph("Daily activity (latest 14 days with tasks)", styles["Heading2"])]
    rows = [["Date (UTC)", "Tasks created", "Completed tasks"]] + [[item["day"], str(item["created"]), str(item["completed"])] for item in summary["daily"]]
    if len(rows) == 1: rows.append(["No task activity yet", "-", "-"])
    daily = Table(rows, colWidths=[2.6*inch, 1.8*inch, 1.8*inch])
    daily.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#2C6E7E")), ("TEXTCOLOR", (0,0), (-1,0), colors.white), ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"), ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#F4F8FA")]), ("ALIGN", (1,1), (-1,-1), "CENTER"), ("GRID", (0,0), (-1,-1), .35, colors.HexColor("#C9D8DF")), ("TOPPADDING", (0,0), (-1,-1), 6), ("BOTTOMPADDING", (0,0), (-1,-1), 6)]))
    story += [daily, Spacer(1,14), Paragraph("Artifact handling: PDF stays on the server; the job returns a download URL instead of passing file bytes through the queue.", styles["Muted"])]
    doc.build(story)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

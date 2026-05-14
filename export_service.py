"""
Report export service for generating reports in various formats (CSV, JSON, PDF).
"""

import csv
import json
import io
import datetime
from analytics_service import get_summary_report, get_post_statistics, get_pool_statistics, get_tag_statistics, get_top_uploaders

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_csv_report(report_type: str = "summary") -> str:
    """
    Generate a CSV report.
    
    Args:
        report_type: 'summary', 'posts', 'pools', or 'tags'
    
    Returns:
        CSV string
    """
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "summary":
        report = get_summary_report()
        
        writer.writerow(["SheepBooru Analytics Report"])
        writer.writerow([f"Generated: {report['generated_at']}"])
        writer.writerow([])
        
        writer.writerow(["SUMMARY STATISTICS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Posts", report["total_posts"]])
        writer.writerow(["Total Users", report["total_users"]])
        writer.writerow(["Storage Used (MB)", report["storage_used_mb"]])
        writer.writerow([])
        
        writer.writerow(["ACTIVITY - TODAY"])
        writer.writerow(["Action Type", "Count"])
        writer.writerow(["Uploads", report["activity_today"]["upload_count"]])
        writer.writerow(["Downloads", report["activity_today"]["download_count"]])
        writer.writerow(["Deletes", report["activity_today"]["delete_count"]])
        writer.writerow([])
        
        writer.writerow(["ACTIVITY - WEEK"])
        writer.writerow(["Action Type", "Count"])
        writer.writerow(["Uploads", report["activity_week"]["upload_count"]])
        writer.writerow(["Downloads", report["activity_week"]["download_count"]])
        writer.writerow(["Deletes", report["activity_week"]["delete_count"]])
        writer.writerow([])
        
        writer.writerow(["ACTIVITY - MONTH"])
        writer.writerow(["Action Type", "Count"])
        writer.writerow(["Uploads", report["activity_month"]["upload_count"]])
        writer.writerow(["Downloads", report["activity_month"]["download_count"]])
        writer.writerow(["Deletes", report["activity_month"]["delete_count"]])
    
    elif report_type == "posts":
        report = get_post_statistics()
        
        writer.writerow(["SheepBooru Post Statistics"])
        writer.writerow([f"Generated: {datetime.datetime.now().isoformat()}"])
        writer.writerow([])
        
        writer.writerow(["POST STATISTICS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Posts", report["total_posts"]])
        writer.writerow(["Untagged Posts", report["untagged_posts"]])
        writer.writerow(["Average Favorites", report["average_favorites"]])
        writer.writerow([])
        
        writer.writerow(["TOP 10 FAVORITED POSTS"])
        writer.writerow(["Post ID", "Description", "Favorite Count"])
        for post in report["top_favorited_posts"]:
            writer.writerow([post["id"], post.get("description", "N/A"), post["favorite_count"]])
    
    elif report_type == "pools":
        report = get_pool_statistics()
        
        writer.writerow(["SheepBooru Pool Statistics"])
        writer.writerow([f"Generated: {datetime.datetime.now().isoformat()}"])
        writer.writerow([])
        
        writer.writerow(["POOL STATISTICS"])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Pools", report["total_pools"]])
        writer.writerow([])
        
        writer.writerow(["TOP POOL CREATORS"])
        writer.writerow(["Username", "Pool Count"])
        for creator in report["top_creators"]:
            writer.writerow([creator["username"], creator["pool_count"]])
    
    elif report_type == "tags":
        report = get_tag_statistics(20)
        
        writer.writerow(["SheepBooru Tag Statistics"])
        writer.writerow([f"Generated: {datetime.datetime.now().isoformat()}"])
        writer.writerow([])
        
        writer.writerow(["TOP TAGS"])
        writer.writerow(["Tag Name", "Post Count"])
        for tag in report["most_used_tags"]:
            writer.writerow([tag["tag_name"], tag["post_count"]])
    
    elif report_type == "uploaders":
        report = {"top_uploaders": get_top_uploaders()}
        
        writer.writerow(["SheepBooru Top Uploaders"])
        writer.writerow([f"Generated: {datetime.datetime.now().isoformat()}"])
        writer.writerow([])
        
        writer.writerow(["TOP UPLOADERS"])
        writer.writerow(["Username", "Post Count"])
        for uploader in report["top_uploaders"]:
            writer.writerow([uploader["username"], uploader["post_count"]])
    
    return output.getvalue()


def generate_json_report(report_type: str = "summary") -> str:
    """
    Generate a JSON report.
    
    Args:
        report_type: 'summary', 'posts', 'pools', 'tags', or 'uploaders'
    
    Returns:
        JSON string
    """
    if report_type == "summary":
        data = get_summary_report()
    elif report_type == "posts":
        data = get_post_statistics()
    elif report_type == "pools":
        data = get_pool_statistics()
    elif report_type == "tags":
        data = get_tag_statistics()
    elif report_type == "uploaders":
        data = {"top_uploaders": get_top_uploaders()}
    else:
        data = get_summary_report()
    
    data["report_type"] = report_type
    data["generated_at"] = datetime.datetime.now().isoformat()
    
    return json.dumps(data, indent=2, default=str)


def generate_pdf_report(report_type: str = "summary") -> bytes:
    """
    Generate a PDF report.
    
    Args:
        report_type: 'summary', 'posts', 'pools', or 'tags'
    
    Returns:
        PDF bytes
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError("ReportLab not installed. Install with: pip install reportlab")
    
    try:
        # Create PDF in memory
        pdf_buffer = io.BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e6ed8'),
            spaceAfter=30,
            alignment=1  # Center
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1e6ed8'),
            spaceAfter=12,
            spaceBefore=12,
        )
        
        # Title
        elements.append(Paragraph("SheepBooru Analytics Report", title_style))
        elements.append(Paragraph(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 0.3 * inch))
        
        if report_type == "summary":
            report = get_summary_report()
            
            # Summary statistics
            elements.append(Paragraph("Summary Statistics", heading_style))
            summary_data = [
                ["Metric", "Value"],
                ["Total Posts", str(report["total_posts"])],
                ["Total Users", str(report["total_users"])],
                ["Storage Used (MB)", str(report["storage_used_mb"])],
            ]
            summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e6ed8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 0.2 * inch))
            
            # Activity stats
            elements.append(Paragraph("Activity - Today", heading_style))
            activity_data = [
                ["Action Type", "Count"],
                ["Uploads", str(report["activity_today"]["upload_count"])],
                ["Downloads", str(report["activity_today"]["download_count"])],
                ["Deletes", str(report["activity_today"]["delete_count"])],
            ]
            activity_table = Table(activity_data, colWidths=[3*inch, 2*inch])
            activity_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e6ed8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(activity_table)
        
        elif report_type == "posts":
            report = get_post_statistics()
            
            elements.append(Paragraph("Post Statistics", heading_style))
            posts_data = [
                ["Metric", "Value"],
                ["Total Posts", str(report["total_posts"])],
                ["Untagged Posts", str(report["untagged_posts"])],
                ["Average Favorites", str(report["average_favorites"])],
            ]
            posts_table = Table(posts_data, colWidths=[3*inch, 2*inch])
            posts_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e6ed8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(posts_table)
        
        elif report_type == "tags":
            report = get_tag_statistics(20)
            
            elements.append(Paragraph("Tag Statistics", heading_style))
            tags_data = [["Tag Name", "Post Count"]]
            for tag in report["most_used_tags"]:
                tags_data.append([tag["tag_name"], str(tag["post_count"])])
            
            tags_table = Table(tags_data, colWidths=[3*inch, 2*inch])
            tags_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e6ed8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(tags_table)
        
        # Build PDF
        doc.build(elements)
        return pdf_buffer.getvalue()
    except Exception as e:
        print(f"Error in generate_pdf_report({report_type}): {str(e)}")
        import traceback
        traceback.print_exc()
        raise

import re
from io import BytesIO
from fpdf import FPDF


def _legacy_sections_to_resume(sections: list[dict]) -> dict:
    resume = {"contact": {}, "summary": "", "experiences": [], "education": [], "skills": [], "projects": [], "certifications": []}
    for sec in sections:
        name = (sec.get("name") or "").lower()
        improved = sec.get("improved", "")
        improved_bullets = sec.get("improved_bullets") or []
        if "summary" in name or "profile" in name:
            resume["summary"] = improved
        elif "skill" in name:
            resume["skills"] = [s.strip() for s in improved.split(",") if s.strip()]
        elif "education" in name or "edu" in name:
            resume["education"].append({"degree": name.replace("education", "").strip(), "school": improved, "bullets": []})
        elif "project" in name.lower():
            resume["projects"].append({"name": name, "bullets": improved_bullets})
        elif "cert" in name.lower():
            resume["certifications"] = [s.strip() for s in improved.split(",") if s.strip()]
        elif improved_bullets:
            resume["experiences"].append({"job_title": name, "bullets": improved_bullets})
    return resume


class ResumePDF(FPDF):
    WATERMARK = "Tailored with Applyd AI"

    def __init__(self, font_size: int = 10):
        super().__init__()
        self.font_size = font_size
        self.set_auto_page_break(auto=True, margin=20)

    def _name(self, text: str):
        self.set_font("Helvetica", "B", self.font_size + 6)
        self.cell(0, 8, text.strip(), new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(1)

    def _contact_line(self, parts: list[str]):
        self.set_font("Helvetica", "", self.font_size - 1)
        text = "  |  ".join(p for p in parts if p)
        self.cell(0, 5, text, new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(3)

    def _section(self, title: str):
        self.set_font("Helvetica", "B", self.font_size + 1)
        self.cell(0, 7, title.upper(), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(60, 60, 60)
        self.set_line_width(0.4)
        y = self.get_y()
        self.line(self.l_margin, y, self.w - self.r_margin, y)
        self.ln(4)

    def _entry_header(self, left: str, right: str):
        self.set_font("Helvetica", "B", self.font_size)
        w_right = self.get_string_width(right) + 2
        self.cell(self.w - self.l_margin - self.r_margin - w_right, 5, left.strip())
        self.set_font("Helvetica", "", self.font_size)
        self.cell(w_right, 5, right.strip(), align="R")
        self.ln(5)

    def _entry_subtitle(self, text: str):
        self.set_font("Helvetica", "I", self.font_size - 1)
        self.cell(0, 4, text.strip())
        self.ln(4)

    def _bullet(self, text: str):
        self.set_font("Helvetica", "", self.font_size)
        x = self.get_x()
        self.cell(5, 5, "-")
        self.set_x(x + 5)
        self.multi_cell(0, 5, text.strip())
        self.ln(1)

    def _body(self, text: str):
        self.set_font("Helvetica", "", self.font_size)
        self.multi_cell(0, 5, text.strip())
        self.ln(2)

    def _skill_line(self, skills: list[str]):
        if not skills:
            return
        self.set_font("Helvetica", "", self.font_size)
        self.multi_cell(0, 5, ", ".join(skills))
        self.ln(2)

    def _watermark(self):
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(180, 180, 180)
        self.cell(0, 10, self.WATERMARK, align="C")

    def _two_col(self, left: str, right: str, left_bold: bool = False):
        if left_bold:
            self.set_font("Helvetica", "B", self.font_size)
        else:
            self.set_font("Helvetica", "", self.font_size)
        w_right = self.get_string_width(right) + 2
        self.cell(self.w - self.l_margin - self.r_margin - w_right, 5, left.strip(), align="L")
        self.set_font("Helvetica", "", self.font_size)
        self.cell(w_right, 5, right.strip(), align="R")
        self.ln(5)

    def build(self, resume_text: str, improved_points: list | None = None) -> BytesIO:
        self.add_page()
        self._name("RESUME")
        self._contact_line(["Tailored Resume"])

        content = resume_text
        sections_raw = content.split("\n\n")

        for section in sections_raw:
            section = section.strip()
            if not section:
                continue
            lines = section.split("\n")
            title = lines[0].strip() if lines else ""
            if title and (title.isupper() or len(title) < 40) and not title.startswith(("-", "*", "•")):
                self._section(title)
                body = "\n".join(lines[1:]).strip()
            else:
                body = section

            for line in body.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if line.startswith(("-", "*", "•")) or (
                    line and line[0].isdigit() and len(line) > 1 and line[1] in ".)"
                ):
                    cleaned = re.sub(r"^[-•*\d.)\s]+", "", line).strip()
                    if cleaned:
                        self._bullet(cleaned)
                else:
                    self.set_font("Helvetica", "", self.font_size)
                    self.multi_cell(0, 5, line)
                    self.ln(1)

        self._watermark()
        return BytesIO(self.output())

    def build_from_text(self, full_text: str) -> BytesIO:
        pdf = ResumePDF()
        pdf.add_page()
        pdf._name("RESUME")
        pdf._contact_line(["Tailored Resume"])

        for block in full_text.split("\n\n"):
            block = block.strip()
            if not block:
                continue
            lines = block.split("\n")
            first = lines[0].strip()
            rest = "\n".join(lines[1:]).strip() if len(lines) > 1 else ""

            if first and (first.isupper() or len(first) < 50):
                pdf._section(first)
                content = rest
            else:
                content = block

            for line in content.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if line.startswith(("-", "*", "•")) or (
                    line and line[0].isdigit() and len(line) > 1 and line[1] in ".)"
                ):
                    cleaned = re.sub(r"^[-•*\d.)\s]+", "", line).strip()
                    if cleaned:
                        pdf._bullet(cleaned)
                else:
                    pdf.set_font("Helvetica", "", pdf.font_size)
                    pdf.multi_cell(0, 5, line)
                    pdf.ln(1)

        pdf._watermark()
        return BytesIO(pdf.output())

    def build_structured(self, resume: dict | list) -> BytesIO:
        if isinstance(resume, list):
            resume = _legacy_sections_to_resume(resume)
        pdf = ResumePDF()
        pdf.add_page()

        contact = resume.get("contact") or {}
        pdf._name(contact.get("name", "RESUME"))
        contact_parts = [contact.get(k, "") for k in ("email", "phone", "location")]
        linkedin = contact.get("linkedin", "")
        website = contact.get("website", "")
        extra_parts = [p for p in [linkedin, website] if p]
        if extra_parts:
            contact_parts.extend(extra_parts)
        pdf._contact_line(contact_parts)

        summary = resume.get("summary", "")
        if summary:
            pdf._section("Professional Summary")
            pdf._body(summary)

        experiences = resume.get("experiences", [])
        if experiences:
            pdf._section("Experience")
            for exp in experiences:
                title = exp.get("job_title", "")
                company = exp.get("company", "")
                dates = f"{exp.get('start_date', '')} - {exp.get('end_date', '')}".strip(" -")
                if title:
                    pdf._entry_header(title, dates)
                elif company:
                    pdf._entry_header(company, dates)
                if company and title:
                    pdf._entry_subtitle(company)
                location = exp.get("location", "")
                if location:
                    pdf._entry_subtitle(location)
                for b in exp.get("bullets", []):
                    pdf._bullet(b)
                pdf.ln(2)

        education = resume.get("education", [])
        if education:
            pdf._section("Education")
            for edu in education:
                degree = edu.get("degree", "")
                school = edu.get("school", "")
                dates = f"{edu.get('start_date', '')} - {edu.get('end_date', '')}".strip(" -")
                left = f"{degree}" if degree else ""
                if school:
                    left = f"{left} - {school}" if left else school
                pdf._two_col(left, dates, left_bold=True)
                loc = edu.get("location", "")
                gpa = edu.get("gpa", "")
                if loc or gpa:
                    pdf._entry_subtitle(f"{loc}{' | ' if loc and gpa else ''}{'GPA: ' + gpa if gpa else ''}")
                pdf.ln(1)

        skills = resume.get("skills", [])
        if skills:
            pdf._section("Skills")
            pdf._skill_line(skills)

        projects = resume.get("projects", [])
        if projects:
            pdf._section("Projects")
            for proj in projects:
                name = proj.get("name", "")
                if name:
                    pdf.set_font("Helvetica", "B", pdf.font_size)
                    pdf.cell(0, 5, name)
                    pdf.ln(5)
                desc = proj.get("description", "")
                if desc:
                    pdf._body(desc)
                for b in proj.get("bullets", []):
                    pdf._bullet(b)
                pdf.ln(1)

        certifications = resume.get("certifications", [])
        if certifications:
            pdf._section("Certifications")
            pdf._skill_line(certifications)

        pdf._watermark()
        return BytesIO(pdf.output())

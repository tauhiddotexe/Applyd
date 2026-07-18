import re
from io import BytesIO
from fpdf import FPDF


class ResumePDF(FPDF):
    WATERMARK = "Tailored with Applyd AI"

    def __init__(self, font_size: int = 10):
        super().__init__()
        self.font_size = font_size
        self.set_auto_page_break(auto=True, margin=20)

    def _header_block(self):
        self.set_font("Helvetica", "B", self.font_size + 4)
        self.cell(0, 10, "RESUME", new_x="LMARGIN", new_y="NEXT", align="C")
        self.ln(4)

    def _section(self, title: str):
        self.set_font("Helvetica", "B", self.font_size + 1)
        self.cell(0, 7, title.upper(), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(0, 0, 0)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(3)

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

    def _watermark(self):
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(180, 180, 180)
        self.cell(0, 10, self.WATERMARK, align="C")

    def build(self, resume_text: str, improved_points: list | None = None) -> BytesIO:
        self.add_page()
        self._header_block()

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

    def build_structured(self, sections: list[dict]) -> BytesIO:
        pdf = ResumePDF()
        pdf.add_page()
        pdf._header_block()

        for sec in sections:
            name = sec.get("name", "")
            if not name:
                continue
            pdf._section(name)

            improved_bullets = sec.get("improved_bullets")
            improved_text = sec.get("improved")

            if improved_bullets:
                for b in improved_bullets:
                    pdf._bullet(b)
            elif improved_text:
                pdf._body(improved_text)

        pdf._watermark()
        return BytesIO(pdf.output())

    def build_from_text(self, full_text: str) -> BytesIO:
        pdf = ResumePDF()
        pdf.add_page()
        pdf._header_block()

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

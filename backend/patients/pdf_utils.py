import subprocess
import tempfile
import os
from django.http import HttpResponse

GENDER_LABELS = {'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro'}

LATEX_SPECIALS = {
    '\\': r'\textbackslash{}',
    '&': r'\&',
    '%': r'\%',
    '$': r'\$',
    '#': r'\#',
    '_': r'\_',
    '{': r'\{',
    '}': r'\}',
    '~': r'\textasciitilde{}',
    '^': r'\textasciicircum{}',
}


def esc(text):
    """Escapa caracteres especiales de LaTeX para que no rompan el PDF."""
    if text is None:
        return ''
    return ''.join(LATEX_SPECIALS.get(ch, ch) for ch in str(text))


def esc_multiline(text):
    """Como esc(), pero cada salto de línea pasa a ser un párrafo nuevo."""
    return esc(text).replace('\r\n', '\n').replace('\n', '\n\n')


def compile_latex_to_response(tex_content, filename):
    """Compila el texto LaTeX a PDF y lo devuelve como descarga."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "doc.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(tex_content)

        result = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "-output-directory", tmpdir, tex_path],
            capture_output=True, text=True,
        )

        pdf_path = os.path.join(tmpdir, "doc.pdf")
        if not os.path.exists(pdf_path):
            return HttpResponse(f"Error al generar PDF:\n{result.stdout}", status=500)

        with open(pdf_path, "rb") as f:
            pdf_data = f.read()

    response = HttpResponse(pdf_data, content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
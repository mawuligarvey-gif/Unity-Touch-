import sys
from pathlib import Path
pdf_path = Path('assets/docs/registration.pdf')
if not pdf_path.exists():
    print('MISSING')
    sys.exit(0)

# Try pypdf
try:
    from pypdf import PdfReader
    reader = PdfReader(str(pdf_path))
    for i, p in enumerate(reader.pages, start=1):
        txt = p.extract_text()
        print('\n----- PAGE', i, '-----\n')
        print(txt or '[NO_TEXT]')
    sys.exit(0)
except Exception as e:
    print('PYPDF_ERROR:', e)

# Try PyPDF2
try:
    import PyPDF2
    reader = PyPDF2.PdfReader(str(pdf_path))
    for i, p in enumerate(reader.pages, start=1):
        try:
            txt = p.extract_text()
        except Exception:
            txt = None
        print('\n----- PAGE', i, '-----\n')
        print(txt or '[NO_TEXT]')
    sys.exit(0)
except Exception as e:
    print('PYPDF2_ERROR:', e)

# Try pdfminer.six
try:
    from io import StringIO
    from pdfminer.high_level import extract_text_to_fp
    output_string = StringIO()
    with open(pdf_path, 'rb') as fh:
        extract_text_to_fp(fh, output_string)
    text = output_string.getvalue()
    print(text or '[NO_TEXT]')
    sys.exit(0)
except Exception as e:
    print('PDFMINER_ERROR:', e)
    sys.exit(0)
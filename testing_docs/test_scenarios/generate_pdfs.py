import os
import re
import sys
import subprocess

# Ensure required packages are installed
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Preformatted
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    print("Installing reportlab and Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "reportlab", "Pillow", "--quiet"])
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Preformatted
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow", "--quiet"])
    from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_pdf(filepath, content):
    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()
    
    code_style = ParagraphStyle(
        'AsciiTableStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.0,
        leading=10.0,
        textColor=colors.black,
        wordWrap=None
    )
    
    story = [Preformatted(content.strip(), code_style)]
    doc.build(story)

def create_image(filepath, content):
    lines = content.strip().split('\n')
    max_len = max(len(line) for line in lines) if lines else 1
    num_lines = len(lines) if lines else 1
    
    try:
        font = ImageFont.truetype("Courier", 14)
        char_w, char_h = 8, 16
    except Exception:
        font = ImageFont.load_default()
        char_w, char_h = 7, 14
        
    width = max(max_len * char_w + 60, 600)
    height = max(num_lines * char_h + 60, 400)
    
    bg_color = (250, 250, 250)
    text_color = (20, 20, 20)
    
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    y = 30
    for line in lines:
        draw.text((30, y), line, font=font, fill=text_color)
        y += char_h
        
    if "REJECTED" in filepath or "blurry" in filepath.lower():
        img = img.filter(ImageFilter.GaussianBlur(radius=1.2))
        
    img.save(filepath)

def parse_and_generate_for_md(md_path, target_dir):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    file_pattern = re.compile(r'([a-zA-Z0-9_\-\.\']+\.(?:pdf|jpeg|jpg|png))', re.IGNORECASE)
    
    i = 0
    n = len(lines)
    generated_count = 0
    
    while i < n:
        line = lines[i]
        if line.strip().startswith(('###', '####', '-', '*')) or 'pdf' in line.lower() or 'jpeg' in line.lower() or 'jpg' in line.lower() or 'png' in line.lower():
            match = file_pattern.search(line)
            if match:
                filename = match.group(1)
                if any(filename.lower().endswith(ext) for ext in ['.pdf', '.jpeg', '.jpg', '.png']):
                    content_lines = []
                    j = i + 1
                    in_code_block = False
                    code_block_found = False
                    
                    while j < n:
                        curr = lines[j]
                        if not in_code_block and curr.strip().startswith(('###', '####')):
                            if code_block_found:
                                break
                            if file_pattern.search(curr):
                                break
                                
                        if curr.strip().startswith('```'):
                            if not in_code_block:
                                in_code_block = True
                                code_block_found = True
                                j += 1
                                continue
                            else:
                                in_code_block = False
                                break
                        else:
                            if in_code_block:
                                content_lines.append(curr)
                            elif not code_block_found and curr.strip().startswith(('-', '*')):
                                content_lines.append(curr)
                        j += 1
                        
                    if code_block_found and content_lines:
                        full_content = "".join(content_lines)
                        out_path = os.path.join(target_dir, filename)
                        try:
                            if filename.lower().endswith('.pdf'):
                                create_pdf(out_path, full_content)
                            else:
                                create_image(out_path, full_content)
                            print(f"  [+] Generated: {filename} ({len(content_lines)} lines)")
                            generated_count += 1
                        except Exception as e:
                            print(f"  [!] Error generating {filename}: {e}")
                        i = j
                        continue
        i += 1
    return generated_count

def main():
    base_dir = "/Users/md.kamranalam/Programming/projects/credixa/private_docs/test_scenarios"
    total_generated = 0
    
    print("====================================================")
    print("Starting Automated PDF/Image Generation for Scenarios")
    print("====================================================")
    
    for item in sorted(os.listdir(base_dir)):
        sub_dir = os.path.join(base_dir, item)
        if os.path.isdir(sub_dir) and not item.startswith('.'):
            md_files = [f for f in os.listdir(sub_dir) if f.endswith('.md')]
            if md_files:
                md_path = os.path.join(sub_dir, md_files[0])
                print(f"\nProcessing Scenario: {item} ({md_files[0]})")
                count = parse_and_generate_for_md(md_path, sub_dir)
                total_generated += count
                
    print("\n====================================================")
    print(f"Completed! Successfully generated {total_generated} PDF/Image documents across all directories.")
    print("====================================================")

if __name__ == "__main__":
    main()

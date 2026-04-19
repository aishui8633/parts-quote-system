import openpyxl
import json

EXCEL_PATH = r'C:\Users\aishu\.openclaw\workspace\parts-quote-system\data\山河钻机海螺配件价格改(4.19)_1242.xlsx'
JSON_PATH = r'C:\Users\aishu\.openclaw\workspace\parts-quote-system\data\parts.json'
BACKUP_PATH = r'C:\Users\aishu\.openclaw\workspace\parts-quote-system\data\parts.json.backup'

# 备份旧数据
import shutil
shutil.copy2(JSON_PATH, BACKUP_PATH)

wb = openpyxl.load_workbook(EXCEL_PATH)
ws = wb.active

parts = []
for row in ws.iter_rows(min_row=2, values_only=True):  # 跳过表头
    idx, spec, name, price = row[0], row[1], row[2], row[3]
    if idx is None:
        continue
    parts.append({
        "id": int(idx) if isinstance(idx, (int, float)) else idx,
        "brand": "山河智能",
        "partName": str(name).strip() if name else "",
        "specification": str(spec).strip() if spec else "",
        "unit": "PCS",
        "marketPrice": int(float(price)) if price else 0
    })

with open(JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(parts, f, ensure_ascii=False, indent=2)

print(f'OK: {len(parts)} records converted')
print(f'Saved to: {JSON_PATH}')
print(f'Backup: {BACKUP_PATH}')

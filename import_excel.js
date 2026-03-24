const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 读取 Excel 文件
const excelPath = path.join('D:', '下载', '山河钻机海螺配件价格汇总_去重.xlsx');
const outputPath = path.join(__dirname, 'data', 'parts.json');

console.log('正在读取 Excel 文件...');

try {
  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`读取到 ${data.length} 条记录`);

  // 转换为系统格式
  const parts = data.map((row, index) => {
    const cols = Object.keys(row);
    return {
      id: index + 1,
      brand: '山河智能',
      partName: row[cols[2]] || '',      // 零件名称
      specification: row[cols[1]] || '', // 规格型号
      unit: 'PCS',
      marketPrice: Math.floor(row[cols[3]] || 0) // 当期含税牌价（取整）
    };
  });

  // 保存到 JSON 文件
  fs.writeFileSync(outputPath, JSON.stringify(parts, null, 2), 'utf8');

  console.log(`\n[OK] 导入完成！`);
  console.log(`保存路径：${outputPath}`);
  console.log(`总记录数：${parts.length}`);
  console.log(`\n前 5 条记录：`);
  console.log(JSON.stringify(parts.slice(0, 5), null, 2));

} catch (err) {
  console.error('导入失败:', err.message);
  process.exit(1);
}

import pandas as pd

# 读取 Excel 文件
input_file = r'D:\下载\山河钻机海螺配件价格汇总.xlsx'
output_file = r'D:\下载\山河钻机海螺配件价格汇总_去重.xlsx'

print('正在读取 Excel 文件...')
df = pd.read_excel(input_file)

# 显示列名
print(f'列名：{df.columns.tolist()}')
print(f'原始数据行数：{len(df)}')

# 获取列名（处理可能的乱码）
cols = df.columns.tolist()
spec_col = cols[1]  # 规格型号
price_col = cols[3]  # 当期含税牌价

print(f'规格型号列：{spec_col}')
print(f'价格列：{price_col}')

# 按规格型号分组，保留价格最高的记录
print('\n正在去重（保留价格最高的记录）...')
df_sorted = df.sort_values(by=price_col, ascending=False)
df_deduped = df_sorted.drop_duplicates(subset=[spec_col], keep='first')

print(f'去重后行数：{len(df_deduped)}')
print(f'删除行数：{len(df) - len(df_deduped)}')

# 保存结果
df_deduped.to_excel(output_file, index=False)
print(f'\n[OK] 已保存到：{output_file}')

# 显示一些示例
print('\n去重后的前 10 条记录：')
print(df_deduped.head(10))

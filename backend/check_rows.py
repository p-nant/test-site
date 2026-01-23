import csv

csv_file = "Mubende Costs Sept to Dec 2025.csv"
row_count = 0

with open(csv_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file, delimiter=';')
    for i, row in enumerate(reader):
        row_count = i + 1
        if i >= 3 and i <= 10:  # Show rows 3-10
            print(f"Row {i}: {row[:4]}")  # Show first 4 columns

print(f"\nTotal rows in CSV: {row_count}")

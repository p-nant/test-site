import csv

csv_file = "Mubende Costs Sept to Dec 2025.csv"

with open(csv_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file, delimiter=';')
    
    for i, row in enumerate(reader):
        print(f"Row {i}: {row}")
        if i > 10:  # Just show first 11 rows
            break

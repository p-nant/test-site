import csv
from datetime import datetime
from database import SessionLocal, engine, Base
from models import Expense as ExpenseModel

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def parse_date(date_str):
    """Convert date string to Python date object"""
    try:
        # Try parsing M/D/YY format
        dt = datetime.strptime(date_str, "%m/%d/%y")
        return dt.date()  # Return date object, not string
    except:
        try:
            # Try parsing other common formats
            dt = datetime.strptime(date_str, "%d/%m/%Y")
            return dt.date()  # Return date object, not string
        except:
            print(f"Warning: Could not parse date: {date_str}")
            return None

def parse_amount(amount_str):
    """Parse amount string, handle negative values and formatting"""
    if not amount_str or amount_str.strip() == "":
        return 0.0
    
    # Remove spaces (including non-breaking spaces \xa0), commas, and parentheses
    cleaned = amount_str.strip().replace("\xa0", "").replace(" ", "").replace(",", "")
    
    # Handle negative values in parentheses
    if cleaned.startswith("(") and cleaned.endswith(")"):
        cleaned = "-" + cleaned[1:-1]
    
    try:
        return float(cleaned)
    except:
        return 0.0

def import_expenses():
    db = SessionLocal()
    
    csv_file = "Mubende Costs Sept to Dec 2025.csv"
    
    # Cost centre columns (column index : name)
    cost_centres = {
        4: "Remittances",
        5: "Admin Costs",
        6: "Termination",
        7: "Other",
        8: "Construction",
        9: "Seedlings",
        10: "Coffee"
    }
    
    imported_count = 0
    skipped_count = 0
    
    with open(csv_file, 'r', encoding='utf-8') as file:
        reader = csv.reader(file, delimiter=';')
        
        # Dynamically locate the header row so we stay resilient to manual edits in the CSV
        headers = None
        header_row_num = 0
        for idx, row in enumerate(reader, start=1):
            row_joined = ";".join(row).lower()
            if "date" in row_joined and "person responsible" in row_joined:
                headers = row
                header_row_num = idx
                break
        
        if not headers:
            print("❌ Could not find header row (missing 'Date'/'Person Responsible'). Aborting import.")
            return
        
        # Find cost centre column indices from headers
        cost_centre_cols = {}
        for idx, header in enumerate(headers):
            header_clean = header.strip() if header else ""
            if header_clean and header_clean not in ["Date", "Person Responsible", "Description", "Expense", ""]:
                cost_centre_cols[idx] = header_clean
        
        print(f"Found cost centre columns: {cost_centre_cols}")
        
        # Now read data starting from the row after headers
        for row_num, row in enumerate(reader, start=header_row_num + 1):
            # Skip empty rows
            if len(row) < 4 or not row[0].strip():
                continue
            
            date_str = row[0].strip()
            person = row[1].strip() if len(row) > 1 else "N/A"
            description = row[2].strip() if len(row) > 2 else ""
            expense_amount = parse_amount(row[3]) if len(row) > 3 else 0.0
            
            # Parse date
            parsed_date = parse_date(date_str)
            if not parsed_date:
                print(f"Skipped row {row_num}: Could not parse date '{date_str}'")
                skipped_count += 1
                continue
            
            # Find which cost centre has a value
            cost_centre = "N/A"
            amount = abs(expense_amount)  # Use absolute value of expense
            
            for col_idx, centre_name in cost_centres.items():
                if len(row) > col_idx and row[col_idx].strip():
                    cost_centre = centre_name
                    # Use the cost centre amount if different from expense
                    centre_amount = parse_amount(row[col_idx])
                    if centre_amount != 0:
                        amount = abs(centre_amount)
                    break
            
            # Skip if no valid amount
            if amount == 0:
                continue
            
            # Create expense record
            expense = ExpenseModel(
                date=parsed_date,
                person=person,
                description=description,
                amount=amount,
                cost_centre=cost_centre
            )
            
            db.add(expense)
            imported_count += 1
            
            if imported_count % 10 == 0:
                print(f"Imported {imported_count} records...")
    
    db.commit()
    db.close()
    
    print(f"\n✅ Import complete!")
    print(f"   Imported: {imported_count} expenses")
    print(f"   Skipped: {skipped_count} rows")

if __name__ == "__main__":
    print("Starting CSV import...")
    print("=" * 50)
    import_expenses()

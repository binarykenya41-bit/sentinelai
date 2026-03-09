"""
Sentinel AI — ERPNext Seed Script
Runs inside frappe/erpnext container via:
  /home/frappe/frappe-bench/env/bin/python /home/frappe/seed/03-erpnext-seed.py

Seeds: Customers, Suppliers, Item Group, Items
All records are idempotent — skipped if they already exist.
"""
import sys
import os

# Add frappe apps to path (frappe docker layout)
BENCH = "/home/frappe/frappe-bench"
sys.path.insert(0, os.path.join(BENCH, "apps", "frappe"))
sys.path.insert(0, os.path.join(BENCH, "apps", "erpnext"))
os.chdir(BENCH)

import frappe

frappe.init(site="logistics.local", sites_path=os.path.join(BENCH, "sites"))
frappe.connect()
frappe.set_user("Administrator")


def upsert(doctype, name, data):
    """Insert a document if it doesn't exist; skip if it does."""
    if frappe.db.exists(doctype, name):
        print(f"  skip {doctype}: {name} (already exists)")
        return
    doc = frappe.get_doc({"doctype": doctype, **data})
    doc.insert(ignore_permissions=True)
    print(f"  created {doctype}: {name}")


print("=== ERPNext Seed — Customers ===")
for c in [
    dict(customer_name="Apex Supply Co",     customer_type="Company", customer_group="Commercial", territory="All Territories"),
    dict(customer_name="BlueStar Retail",    customer_type="Company", customer_group="Commercial", territory="All Territories"),
    dict(customer_name="Central Pharma Ltd", customer_type="Company", customer_group="Commercial", territory="All Territories"),
    dict(customer_name="Delta Electronics",  customer_type="Company", customer_group="Commercial", territory="All Territories"),
    dict(customer_name="Eagle Auto Parts",   customer_type="Company", customer_group="Commercial", territory="All Territories"),
]:
    upsert("Customer", c["customer_name"], c)

print("=== ERPNext Seed — Suppliers ===")
for s in [
    dict(supplier_name="FastFreight Inc",   supplier_type="Company", supplier_group="Services"),
    dict(supplier_name="Ocean Cargo Ltd",   supplier_type="Company", supplier_group="Services"),
    dict(supplier_name="AirExpress Global", supplier_type="Company", supplier_group="Services"),
]:
    upsert("Supplier", s["supplier_name"], s)

print("=== ERPNext Seed — Item Group ===")
upsert("Item Group", "Logistics Goods", dict(
    item_group_name="Logistics Goods",
    parent_item_group="All Item Groups",
))

print("=== ERPNext Seed — Items ===")
for item in [
    dict(item_code="ELEC-001", item_name="Consumer Electronics Bundle", item_group="Logistics Goods", stock_uom="Nos",  is_stock_item=1, description="Mixed consumer electronics shipment"),
    dict(item_code="AUTO-001", item_name="Auto Parts Assortment",       item_group="Logistics Goods", stock_uom="Nos",  is_stock_item=1, description="Automotive parts and accessories"),
    dict(item_code="PHAR-001", item_name="Pharmaceutical Supplies",     item_group="Logistics Goods", stock_uom="Box",  is_stock_item=1, description="Pharmaceutical products (non-controlled)"),
    dict(item_code="FOOD-001", item_name="Perishable Food Items",       item_group="Logistics Goods", stock_uom="Kg",   is_stock_item=1, description="Temperature-sensitive food cargo"),
    dict(item_code="DOC-001",  item_name="Documents and Parcels",       item_group="Logistics Goods", stock_uom="Nos",  is_stock_item=0, description="Document courier and small parcels"),
]:
    upsert("Item", item["item_code"], item)

frappe.db.commit()
print("=== ERPNext seed completed successfully ===")
frappe.destroy()

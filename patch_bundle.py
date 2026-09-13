# -*- coding: utf-8 -*-
import re

with open("public/assets/index-Co2L1R-b.js", "r", encoding="utf-8") as f:
    code = f.read()

with open("helper_code_v2.js", "r", encoding="utf-8") as f:
    new_helper = f.read()

# 1. Find start of custom section
pos_start = code.find("window.__SIZE_GUIDE_PRESETS =")
if pos_start == -1:
    print("Error: Could not find window.__SIZE_GUIDE_PRESETS =")
    exit(1)

# Find end of custom section (where mq starts)
pos_end = code.find(";const mq = ({product:", pos_start)
if pos_end == -1:
    pos_end = code.find(";\nconst mq = ({product:", pos_start)
if pos_end == -1:
    pos_end = code.find("const mq = ({product:", pos_start)
if pos_end == -1:
    print("Error: Could not find end of custom section before mq")
    exit(1)

print(f"Replacing helper from {pos_start} to {pos_end}")
updated_code = code[:pos_start] + new_helper + code[pos_end:]

# 2. Update dynamic span for size guide button in mq
old_span = 'children:"مرجع المقاس"'
new_span = 'children:((ge.sizeGuide&&ge.sizeGuide.displayMode==="product_only")?"مرجع مقاس المنتج":(ge.sizeGuide&&ge.sizeGuide.displayMode==="body_only")?"مرجع مقاس الجسم":"مرجع المقاس")'

count_span = updated_code.count(old_span)
print(f"Occurrences of {old_span}: {count_span}")
if count_span >= 1:
    # Only replace in the product details button context
    target_snippet = 'r.jsx(Q3,{className:"w-3.5 h-3.5 text-blue-600"}),r.jsx("span",{children:"مرجع المقاس"})'
    new_snippet = 'r.jsx(Q3,{className:"w-3.5 h-3.5 text-blue-600"}),r.jsx("span",{' + new_span + '})'
    if target_snippet in updated_code:
        updated_code = updated_code.replace(target_snippet, new_snippet, 1)
        print("Replaced product details size guide button label with dynamic label!")
    else:
        print("Warning: target_snippet not found, checking alternative")

# 3. Ensure saving sizeGuide has fallback
old_save = 'enableSizeGuide:sg_enabled,sizeGuide:sg_data'
new_save = 'enableSizeGuide:sg_enabled,sizeGuide:sg_data||window.__getDefaultSizeGuide(null)'
if old_save in updated_code:
    updated_code = updated_code.replace(old_save, new_save, 1)
    print("Updated save logic with default fallback!")

# Write to a test file first
with open("test_bundle.js", "w", encoding="utf-8") as f:
    f.write(updated_code)

print("Saved test_bundle.js, length:", len(updated_code))

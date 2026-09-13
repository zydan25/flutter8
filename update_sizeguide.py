import sys

with open("public/assets/index-Co2L1R-b.js") as f:
    code = f.read()

# 1. Target the red circle element:
target_red = 'r.jsxs("div",{className:"bg-slate-50 rounded-lg p-2 flex items-center gap-1.5 text-xs text-slate-600 font-medium",children:[r.jsx(bb,{className:"w-3.5 h-3.5 text-emerald-600"}),r.jsx("span",{className:"font-bold text-slate-800",children:"95%"}),r.jsx("span",{children:"وجدته مطابقاً للمقاس"})]})'

if target_red in code:
    print("Found red circle element! Replacing with empty...")
else:
    print("WARNING: target_red not found!")

# 2. Target the yellow circle button:
target_yellow = 'r.jsx("div",{className:"flex items-center justify-between text-xs font-bold text-slate-700 pt-2 border-t border-slate-100",children:r.jsxs("button",{onClick:()=>M(!0),className:"flex items-center gap-1.5 text-slate-900 hover:text-rose-600 transition-colors cursor-pointer",children:[r.jsx(Q3,{className:"w-3.5 h-3.5 text-blue-600"}),r.jsx("span",{children:"مرجع المقاس"})]})})'

if target_yellow in code:
    print("Found yellow circle button! Will make conditional...")
else:
    print("WARNING: target_yellow not found!")

# 3. Target F modal in mq:
pos_F = code.find('F&&r.jsx("div",{className:"absolute inset-0 z-50 bg-black/60')
end_F = code.find('Z&&r.jsx("div",{className:"absolute inset-0 z-50 bg-black/60', pos_F)
print("pos_F:", pos_F, "end_F:", end_F)


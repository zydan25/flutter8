# -*- coding: utf-8 -*-
import json

with open("presets_data.json", "r", encoding="utf-8") as f:
    presets = json.load(f)

presets_json = json.dumps(presets, ensure_ascii=False)

js_code = f"""
window.__SIZE_GUIDE_PRESETS = {presets_json};

window.__convertMeasurementValue = function(val, unit) {{
  if (!val || typeof val !== "string") return val;
  if (unit === "cm") return val;
  var convertSingle = function(numStr) {{
    var n = parseFloat(numStr);
    if (isNaN(n)) return numStr;
    var inches = n / 2.54;
    return (Math.round(inches * 10) / 10).toFixed(1);
  }};
  if (val.indexOf("-") !== -1) {{
    var parts = val.split("-");
    if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) {{
      return convertSingle(parts[0].trim()) + " - " + convertSingle(parts[1].trim());
    }}
  }}
  var singleNum = parseFloat(val);
  if (!isNaN(singleNum) && String(singleNum).length === val.trim().length) {{
    return convertSingle(val.trim());
  }}
  return val;
}};

window.__getDefaultSizeGuide = function(product) {{
  if (product && product.sizeGuide) return product.sizeGuide;
  var pName = ((product && product.name) || "").toLowerCase();
  var pCat = ((product && product.category) || "").toLowerCase();
  var presets = window.__SIZE_GUIDE_PRESETS;
  if (pName.indexOf("رضيع") !== -1 || pName.indexOf("بيبي") !== -1 || pName.indexOf("baby") !== -1) return JSON.parse(JSON.stringify(presets[0]));
  if (pName.indexOf("طفل") !== -1 || pName.indexOf("أطفال") !== -1 || pName.indexOf("بنات") !== -1 || pName.indexOf("ولادي") !== -1 || pCat.indexOf("أطفال") !== -1) return JSON.parse(JSON.stringify(presets[1]));
  if (pName.indexOf("حذاء") !== -1 || pName.indexOf("شوز") !== -1 || pName.indexOf("سنيكرز") !== -1 || pName.indexOf("صندل") !== -1 || pCat.indexOf("أحذية") !== -1) return JSON.parse(JSON.stringify(presets[6]));
  if (pName.indexOf("بنطلون") !== -1 || pName.indexOf("جينز") !== -1 || pName.indexOf("سروال") !== -1) return JSON.parse(JSON.stringify(presets[5]));
  if (pName.indexOf("عباية") !== -1 || pName.indexOf("عبايه") !== -1 || pName.indexOf("جلابية") !== -1) return JSON.parse(JSON.stringify(presets[8]));
  if (pName.indexOf("فستان") !== -1 || pName.indexOf("سهرة") !== -1) return JSON.parse(JSON.stringify(presets[7]));
  if (pName.indexOf("كبير") !== -1 || pName.indexOf("بلس") !== -1 || pName.indexOf("plus") !== -1) return JSON.parse(JSON.stringify(presets[3]));
  if (pName.indexOf("رجالي") !== -1 || pName.indexOf("قميص رجالي") !== -1 || pCat.indexOf("رجالي") !== -1) return JSON.parse(JSON.stringify(presets[4]));
  return JSON.parse(JSON.stringify(presets[2]));
}};

var SizeGuideModal = function(props) {{
  var isOpen = props.isOpen, onClose = props.onClose, product = props.product;
  if (!isOpen) return null;
  var guide = (product && product.sizeGuide) || window.__getDefaultSizeGuide(product);
  var displayMode = (guide && guide.displayMode) || "both";
  var initialTab = displayMode === "body_only" ? "body" : "product";
  var unitState = S.useState("cm"), unit = unitState[0], setUnit = unitState[1];
  var tabState = S.useState(initialTab), tab = tabState[0], setTab = tabState[1];

  S.useEffect(function() {{
    if (displayMode === "body_only") {{
      setTab("body");
    }} else if (displayMode === "product_only") {{
      setTab("product");
    }}
  }}, [displayMode]);

  var fitType = (guide && guide.fitType) || "regular";
  var stretch = (guide && guide.stretch) || "slight";
  var prodTable = (guide && guide.productMeasurements) || window.__SIZE_GUIDE_PRESETS[0].productMeasurements;
  var bodyTable = (guide && guide.bodyMeasurements) || window.__SIZE_GUIDE_PRESETS[0].bodyMeasurements;
  var currentTable = tab === "product" ? prodTable : bodyTable;

  var convertVal = function(val, u) {{
    return window.__convertMeasurementValue(val, u);
  }};

  var formatHeaderTitle = function(colName, cIdx, u) {{
    if (cIdx === 0) return colName;
    if (!colName) return "";
    if (colName.indexOf("(") !== -1 && colName.indexOf(")") !== -1) {{
      return colName;
    }}
    return colName + " (" + (u === "in" ? "بوصة" : "سم") + ")";
  }};

  var modalTitle = displayMode === "product_only" ? "مرجع مقاس المنتج" : displayMode === "body_only" ? "مرجع مقاس الجسم" : "مرجع المقاس";

  return r.jsx("div", {{
    className: "fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn",
    onClick: function(ev) {{ if (ev.target === ev.currentTarget) onClose(); }},
    children: r.jsxs("div", {{
      className: "bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden text-right select-none",
      dir: "rtl",
      children: [
        r.jsxs("div", {{
          className: "flex items-center justify-between p-4 border-b border-slate-100 bg-white sticky top-0 z-10",
          children: [
            r.jsx("button", {{
              type: "button",
              onClick: onClose,
              className: "p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer",
              children: r.jsx(js, {{ className: "w-5 h-5" }})
            }}),
            r.jsx("h3", {{
              className: "text-base font-black text-slate-900",
              children: modalTitle
            }}),
            r.jsxs("div", {{
              className: "flex items-center gap-1.5",
              children: [
                r.jsx("span", {{
                  className: "text-xs font-bold text-slate-600",
                  children: "التبديل إلى"
                }}),
                r.jsxs("div", {{
                  className: "inline-flex p-0.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-bold",
                  children: [
                    r.jsx("button", {{
                      type: "button",
                      onClick: function() {{ setUnit("cm"); }},
                      className: "px-2.5 py-0.5 rounded-full transition-all cursor-pointer " + (unit === "cm" ? "bg-slate-950 text-white shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
                      children: "سم"
                    }}),
                    r.jsx("button", {{
                      type: "button",
                      onClick: function() {{ setUnit("in"); }},
                      className: "px-2.5 py-0.5 rounded-full transition-all cursor-pointer " + (unit === "in" ? "bg-slate-950 text-white shadow-xs font-black" : "text-slate-600 hover:text-slate-900"),
                      children: "بوصة"
                    }})
                  ]
                }})
              ]
            }})
          ]
        }}),
        displayMode === "both" ? r.jsxs("div", {{
          className: "flex border-b border-slate-200 px-4 bg-white shrink-0",
          children: [
            r.jsxs("button", {{
              type: "button",
              onClick: function() {{ setTab("product"); }},
              className: "flex-1 py-3 text-center text-xs sm:text-sm font-bold transition-all relative cursor-pointer " + (tab === "product" ? "text-slate-950 font-black" : "text-slate-500 hover:text-slate-800"),
              children: [
                "قياسات المنتج",
                tab === "product" && r.jsx("div", {{ className: "absolute bottom-0 left-6 right-6 h-0.5 bg-slate-950 rounded-full" }})
              ]
            }}),
            r.jsxs("button", {{
              type: "button",
              onClick: function() {{ setTab("body"); }},
              className: "flex-1 py-3 text-center text-xs sm:text-sm font-bold transition-all relative cursor-pointer " + (tab === "body" ? "text-slate-950 font-black" : "text-slate-500 hover:text-slate-800"),
              children: [
                "مقاسات الجسم",
                tab === "body" && r.jsx("div", {{ className: "absolute bottom-0 left-6 right-6 h-0.5 bg-slate-950 rounded-full" }})
              ]
            }})
          ]
        }}) : r.jsx("div", {{
          className: "px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-800 text-center flex items-center justify-center gap-1.5",
          children: [
            r.jsx("span", {{ children: displayMode === "product_only" ? "📏 جدول أبعاد وقياسات المنتج الفعلية" : "🧍 جدول مقاسات الجسم المناسبة" }})
          ]
        }}),
        r.jsxs("div", {{
          className: "flex-1 overflow-y-auto p-4 space-y-4 text-xs",
          children: [
            r.jsxs("div", {{
              className: "bg-blue-50/90 border border-blue-200/80 rounded-xl p-2.5 flex items-center gap-2 text-blue-900 text-xs font-bold leading-relaxed",
              children: [
                r.jsx(Q3, {{ className: "w-4 h-4 text-blue-600 shrink-0" }}),
                r.jsx("span", {{ children: "تم التحقق من القياسات بواسطة التخفيض الصح مقارنة بالمنتجات الفعلية." }})
              ]
            }}),
            r.jsx("div", {{
              className: "border border-slate-200 rounded-xl overflow-hidden shadow-2xs overflow-x-auto",
              children: r.jsxs("table", {{
                className: "w-full text-center border-collapse text-xs min-w-full",
                children: [
                  r.jsx("thead", {{
                    children: r.jsx("tr", {{
                      children: currentTable.columns.map(function(colName, cIdx) {{
                        return r.jsx("th", {{
                          className: "bg-slate-50 p-2.5 text-slate-700 font-bold border-b border-l border-slate-200 whitespace-nowrap text-center text-[11px]",
                          children: formatHeaderTitle(colName, cIdx, unit)
                        }}, cIdx);
                      }})
                    }})
                  }}),
                  r.jsx("tbody", {{
                    children: currentTable.rows.map(function(row, rIdx) {{
                      return r.jsx("tr", {{
                        className: rIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white",
                        children: row.map(function(cell, cIdx) {{
                          return r.jsx("td", {{
                            className: "p-2.5 border-b border-l border-slate-200 whitespace-nowrap text-[11px] " + (cIdx === 0 ? "font-black text-slate-950 bg-slate-50/80" : "font-semibold text-slate-700"),
                            children: cIdx === 0 ? cell : convertVal(cell, unit)
                          }}, cIdx);
                        }})
                      }}, rIdx);
                    }})
                  }})
                ]
              }})
            }}),
            r.jsx("p", {{
              className: "text-[11px] text-slate-500 leading-relaxed font-medium",
              children: tab === "product"
                ? ("*تم الحصول على هذه البيانات عبر قياس المنتج يدوياً، وقد تتباين القياسات بمقدار " + (unit === "in" ? "0.4-0.8 بوصة." : "1-2 سم."))
                : "*المقاسات المذكورة أعلاه تستخدم كدليل ارشادي فقط؛ يرجى الأخذ في الإعتبار نوع جسمك وعاداتك في ارتداء الملابس"
            }}),
            r.jsx("div", {{ className: "h-px bg-slate-200 my-2" }}),
            r.jsxs("div", {{
              className: "space-y-1.5 pt-1",
              children: [
                r.jsxs("div", {{
                  className: "flex items-center justify-between text-xs font-bold",
                  children: [
                    r.jsx("span", {{ className: "text-slate-900 font-black", children: "نوع القصة" }}),
                    r.jsx("span", {{ className: "text-slate-500 text-[11px]", children: fitType === "tight" ? "قصة ضيقة" : fitType === "oversized" ? "قصة كبيرة الحجم" : "قصة عادية" }})
                  ]
                }}),
                r.jsxs("div", {{
                  className: "flex justify-between text-[11px] font-bold text-slate-600 px-1",
                  children: [
                    r.jsx("span", {{ children: "قصة ضيقة" }}),
                    r.jsx("span", {{ children: "قصة عادية" }}),
                    r.jsx("span", {{ children: "قصة كبيرة الحجم" }})
                  ]
                }}),
                r.jsxs("div", {{
                  className: "relative h-3 flex items-center px-1",
                  children: [
                    r.jsxs("div", {{
                      className: "w-full h-1 bg-slate-200 rounded-full relative flex items-center justify-between",
                      children: [
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }}),
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }}),
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }})
                      ]
                    }}),
                    r.jsx("div", {{
                      className: "absolute top-1/2 -translate-y-1/2 w-8 h-2 bg-slate-950 rounded-full transition-all shadow-xs",
                      style: {{ right: fitType === "tight" ? "4px" : fitType === "oversized" ? "calc(100% - 36px)" : "calc(50% - 16px)" }}
                    }})
                  ]
                }})
              ]
            }}),
            r.jsxs("div", {{
              className: "space-y-1.5 pt-2",
              children: [
                r.jsxs("div", {{
                  className: "flex items-center justify-between text-xs font-bold",
                  children: [
                    r.jsx("span", {{ className: "text-slate-900 font-black", children: "مرونة" }}),
                    r.jsx("span", {{ className: "text-slate-500 text-[11px]", children: stretch === "none" ? "غير" : stretch === "medium" ? "متوسطة" : stretch === "high" ? "للغاية" : "قليلاً" }})
                  ]
                }}),
                r.jsxs("div", {{
                  className: "flex justify-between text-[11px] font-bold text-slate-600 px-1",
                  children: [
                    r.jsx("span", {{ children: "غير" }}),
                    r.jsx("span", {{ children: "قليلاً" }}),
                    r.jsx("span", {{ children: "متوسطة" }}),
                    r.jsx("span", {{ children: "للغاية" }})
                  ]
                }}),
                r.jsxs("div", {{
                  className: "relative h-3 flex items-center px-1",
                  children: [
                    r.jsxs("div", {{
                      className: "w-full h-1 bg-slate-200 rounded-full relative flex items-center justify-between",
                      children: [
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }}),
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }}),
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }}),
                        r.jsx("div", {{ className: "w-1.5 h-1.5 bg-slate-300 rounded-full" }})
                      ]
                    }}),
                    r.jsx("div", {{
                      className: "absolute top-1/2 -translate-y-1/2 w-8 h-2 bg-slate-950 rounded-full transition-all shadow-xs",
                      style: {{ right: stretch === "none" ? "4px" : stretch === "slight" ? "calc(33.3% - 10px)" : stretch === "medium" ? "calc(66.6% - 22px)" : "calc(100% - 36px)" }}
                    }})
                  ]
                }})
              ]
            }})
          ]
        }}),
        r.jsx("div", {{
          className: "p-3 border-t border-slate-100 bg-slate-50 shrink-0",
          children: r.jsx("button", {{
            type: "button",
            onClick: onClose,
            className: "w-full py-2.5 bg-slate-950 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer",
            children: "فهمت، إغلاق"
          }})
        }})
      ]
    }})
  }});
}};

var SizeGuideAdminSection = function(props) {{
  var enableSizeGuide = props.enableSizeGuide, setEnableSizeGuide = props.setEnableSizeGuide;
  var sizeGuide = props.sizeGuide, setSizeGuide = props.setSizeGuide, onShowToast = props.onShowToast;
  var tabState = S.useState("product"), tab = tabState[0], setTab = tabState[1];

  var currentGuide = sizeGuide || window.__SIZE_GUIDE_PRESETS[0];
  var prodTable = currentGuide.productMeasurements || window.__SIZE_GUIDE_PRESETS[0].productMeasurements;
  var bodyTable = currentGuide.bodyMeasurements || window.__SIZE_GUIDE_PRESETS[0].bodyMeasurements;
  var fitType = currentGuide.fitType || "regular";
  var stretch = currentGuide.stretch || "slight";
  var displayMode = currentGuide.displayMode || "both";

  var activeTable = tab === "product" ? prodTable : bodyTable;

  var handleSelectPreset = function(preset) {{
    var clone = JSON.parse(JSON.stringify(preset));
    if (currentGuide && currentGuide.displayMode) {{
      clone.displayMode = currentGuide.displayMode;
    }}
    setSizeGuide(clone);
    if (onShowToast) onShowToast("تم تعبئة المقاسات تلقائياً: " + preset.name, "success");
  }};

  var handleUpdateDisplayMode = function(mode) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    updatedGuide.displayMode = mode;
    if (mode === "body_only" && tab === "product") {{
      setTab("body");
    }} else if (mode === "product_only" && tab === "body") {{
      setTab("product");
    }}
    setSizeGuide(updatedGuide);
    var msg = mode === "both" ? "تم تفعيل كلا الجدولين للعميل (قياسات المنتج + مقاسات الجسم)"
            : mode === "product_only" ? "تم تحديد عرض جدول قياسات المنتج فقط للعميل"
            : "تم تحديد عرض جدول مقاسات الجسم فقط للعميل";
    if (onShowToast) onShowToast(msg, "info");
  }};

  var handleHeaderChange = function(colIndex, newName) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    var targetTable = tab === "product" ? updatedGuide.productMeasurements : updatedGuide.bodyMeasurements;
    if (targetTable && targetTable.columns && targetTable.columns[colIndex] !== undefined) {{
      targetTable.columns[colIndex] = newName;
      setSizeGuide(updatedGuide);
    }}
  }};

  var handleAddColumn = function() {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    var targetTable = tab === "product" ? updatedGuide.productMeasurements : updatedGuide.bodyMeasurements;
    if (targetTable && targetTable.columns && targetTable.rows) {{
      var newColName = tab === "product" ? ("قياس " + targetTable.columns.length) : ("محيط " + targetTable.columns.length);
      targetTable.columns.push(newColName);
      targetTable.rows.forEach(function(row) {{
        row.push("-");
      }});
      setSizeGuide(updatedGuide);
      if (onShowToast) onShowToast("تمت إضافة عمود جديد (" + newColName + ")، يمكنك تعديل عنوانه وقيمه الآن", "success");
    }}
  }};

  var handleDeleteColumn = function(colIndex) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    var targetTable = tab === "product" ? updatedGuide.productMeasurements : updatedGuide.bodyMeasurements;
    if (targetTable && targetTable.columns && targetTable.columns.length > 1) {{
      var colName = targetTable.columns[colIndex];
      targetTable.columns.splice(colIndex, 1);
      targetTable.rows.forEach(function(row) {{
        if (row.length > colIndex) {{
          row.splice(colIndex, 1);
        }}
      }});
      setSizeGuide(updatedGuide);
      if (onShowToast) onShowToast("تم حذف عمود: " + colName, "info");
    }} else {{
      if (onShowToast) onShowToast("لا يمكن حذف العمود الأخير", "warning");
    }}
  }};

  var handleCellChange = function(rowIndex, colIndex, newVal) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    var targetTable = tab === "product" ? updatedGuide.productMeasurements : updatedGuide.bodyMeasurements;
    if (targetTable && targetTable.rows && targetTable.rows[rowIndex]) {{
      targetTable.rows[rowIndex][colIndex] = newVal;
      setSizeGuide(updatedGuide);
    }}
  }};

  var handleAddRow = function() {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    var targetTable = tab === "product" ? updatedGuide.productMeasurements : updatedGuide.bodyMeasurements;
    if (targetTable && targetTable.columns && targetTable.rows) {{
      var newRow = targetTable.columns.map(function(_, idx) {{
        return idx === 0 ? "مقاس جديد" : "-";
      }});
      targetTable.rows.push(newRow);
      setSizeGuide(updatedGuide);
      if (onShowToast) onShowToast("تمت إضافة صف مقاس جديد، يمكنك تعديل قيمه يدوياً", "info");
    }}
  }};

  var handleDeleteRow = function(rowIndex) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    var targetTable = tab === "product" ? updatedGuide.productMeasurements : updatedGuide.bodyMeasurements;
    if (targetTable && targetTable.rows && targetTable.rows.length > 1) {{
      targetTable.rows.splice(rowIndex, 1);
      setSizeGuide(updatedGuide);
      if (onShowToast) onShowToast("تم حذف صف المقاس", "info");
    }}
  }};

  var handleUpdateFit = function(val) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    updatedGuide.fitType = val;
    setSizeGuide(updatedGuide);
  }};

  var handleUpdateStretch = function(val) {{
    var updatedGuide = JSON.parse(JSON.stringify(currentGuide));
    updatedGuide.stretch = val;
    setSizeGuide(updatedGuide);
  }};

  return r.jsxs("div", {{
    className: "p-4 bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/50 rounded-2xl border-2 border-blue-200/90 space-y-4 shadow-xs text-right",
    dir: "rtl",
    children: [
      r.jsxs("div", {{
        className: "flex items-center justify-between pb-3 border-b border-blue-100",
        children: [
          r.jsxs("div", {{
            className: "flex items-center gap-2",
            children: [
              r.jsx("div", {{
                className: "p-1.5 bg-blue-600 text-white rounded-lg shadow-xs",
                children: r.jsx(Q3, {{ className: "w-4 h-4" }})
              }}),
              r.jsxs("div", {{
                children: [
                  r.jsx("h4", {{
                    className: "font-black text-slate-900 text-sm",
                    children: "مرجع المقاسات الذكي (Size Guide)"
                  }}),
                  r.jsx("p", {{
                    className: "text-[11px] text-slate-500",
                    children: "تمكين جدول المقاسات للمنتج وتخصيص الأعمدة والصفوف والجداول المعروضة"
                  }})
                ]
              }})
            ]
          }}),
          r.jsxs("label", {{
            className: "relative inline-flex items-center cursor-pointer",
            children: [
              r.jsx("input", {{
                type: "checkbox",
                checked: enableSizeGuide,
                onChange: function(e) {{
                  setEnableSizeGuide(e.target.checked);
                  if (onShowToast) onShowToast(e.target.checked ? "تم تفعيل زر مرجع المقاس للمنتج" : "تم إلغاء تفعيل مرجع المقاس للمنتج", "info");
                }},
                className: "sr-only peer"
              }}),
              r.jsx("div", {{
                className: "w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"
              }})
            ]
          }})
        ]
      }}),
      enableSizeGuide && r.jsxs("div", {{
        className: "space-y-4 pt-1",
        children: [
          r.jsxs("div", {{
            className: "p-3 bg-white/95 rounded-xl border border-blue-100 shadow-2xs space-y-2",
            children: [
              r.jsxs("div", {{
                className: "flex items-center justify-between",
                children: [
                  r.jsx("label", {{
                    className: "block text-xs font-black text-slate-900",
                    children: "🎯 الجداول المعروضة للعميل في صفحة المنتج:"
                  }}),
                  r.jsx("span", {{
                    className: "text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200",
                    children: displayMode === "both" ? "يظهر للعميل: كلا الجدولين مع تبويب" : displayMode === "product_only" ? "يظهر للعميل: قياسات المنتج فقط" : "يظهر للعميل: مقاسات الجسم فقط"
                  }})
                ]
              }}),
              r.jsxs("div", {{
                className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
                children: [
                  r.jsxs("button", {{
                    type: "button",
                    onClick: function() {{ handleUpdateDisplayMode("both"); }},
                    className: "p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1 " + (displayMode === "both" ? "bg-blue-600 text-white border-blue-700 shadow-xs" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"),
                    children: [
                      r.jsx("span", {{ className: "font-black text-xs", children: "الاثنان معاً (المنتج + الجسم) 📑" }}),
                      r.jsx("span", {{ className: "text-[10px] opacity-85", children: "تبديل بين الجدولين بضغطة زر" }})
                    ]
                  }}),
                  r.jsxs("button", {{
                    type: "button",
                    onClick: function() {{ handleUpdateDisplayMode("product_only"); }},
                    className: "p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1 " + (displayMode === "product_only" ? "bg-blue-600 text-white border-blue-700 shadow-xs" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"),
                    children: [
                      r.jsx("span", {{ className: "font-black text-xs", children: "قياسات المنتج فقط 👕" }}),
                      r.jsx("span", {{ className: "text-[10px] opacity-85", children: "أبعاد القطعة الفعلية فقط" }})
                    ]
                  }}),
                  r.jsxs("button", {{
                    type: "button",
                    onClick: function() {{ handleUpdateDisplayMode("body_only"); }},
                    className: "p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-1 " + (displayMode === "body_only" ? "bg-blue-600 text-white border-blue-700 shadow-xs" : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"),
                    children: [
                      r.jsx("span", {{ className: "font-black text-xs", children: "مقاسات الجسم فقط 🧍" }}),
                      r.jsx("span", {{ className: "text-[10px] opacity-85", children: "قياسات جسم المشتري الموصى بها" }})
                    ]
                  }})
                ]
              }})
            ]
          }}),
          r.jsxs("div", {{
            className: "space-y-1.5",
            children: [
              r.jsx("label", {{
                className: "block text-xs font-black text-slate-800",
                children: "⚡ تعبئة سريعة عبر قوالب المقاسات الجاهزة (اختياري):"
              }}),
              r.jsx("div", {{
                className: "flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-white/80 rounded-xl border border-blue-100",
                children: window.__SIZE_GUIDE_PRESETS.map(function(preset) {{
                  return r.jsx("button", {{
                    type: "button",
                    onClick: function() {{ handleSelectPreset(preset); }},
                    className: "px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all cursor-pointer shadow-2xs",
                    children: preset.name
                  }}, preset.id);
                }})
              }})
            ]
          }}),
          r.jsxs("div", {{
            className: "flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2",
            children: [
              r.jsxs("div", {{
                className: "flex gap-2",
                children: [
                  r.jsxs("button", {{
                    type: "button",
                    onClick: function() {{ setTab("product"); }},
                    className: "px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 " + (tab === "product" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
                    children: [
                      r.jsx("span", {{ children: "1. جدول قياسات المنتج" }}),
                      displayMode === "body_only" ? r.jsx("span", {{ className: "text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold", children: "مخفي" }}) : r.jsx("span", {{ className: "text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold", children: "معروض ✅" }})
                    ]
                  }}),
                  r.jsxs("button", {{
                    type: "button",
                    onClick: function() {{ setTab("body"); }},
                    className: "px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 " + (tab === "body" ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"),
                    children: [
                      r.jsx("span", {{ children: "2. جدول مقاسات الجسم" }}),
                      displayMode === "product_only" ? r.jsx("span", {{ className: "text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold", children: "مخفي" }}) : r.jsx("span", {{ className: "text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-bold", children: "معروض ✅" }})
                    ]
                  }})
                ]
              }}),
              r.jsxs("div", {{
                className: "flex items-center gap-2",
                children: [
                  r.jsx("button", {{
                    type: "button",
                    onClick: handleAddColumn,
                    className: "px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-2xs flex items-center gap-1",
                    children: "+ إضافة عمود قياس جديد"
                  }}),
                  r.jsx("button", {{
                    type: "button",
                    onClick: handleAddRow,
                    className: "px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shadow-2xs flex items-center gap-1",
                    children: "+ إضافة صف مقاس جديد"
                  }})
                ]
              }})
            ]
          }}),
          r.jsxs("div", {{
            className: "space-y-2",
            children: [
              r.jsxs("div", {{
                className: "flex items-center justify-between text-[11px] text-slate-600 font-bold",
                children: [
                  r.jsx("span", {{
                    children: "💡 يمكنك تعديل أسماء الأعمدة في رأس الجدول مباشرة، وحذف أي عمود بالضغط على (✕)"
                  }}),
                  r.jsx("span", {{
                    className: "text-blue-600",
                    children: "القيم بوحدة (سم) وتتحول للبوصة تلقائياً"
                  }})
                ]
              }}),
              r.jsx("div", {{
                className: "border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs overflow-x-auto max-h-64",
                children: r.jsxs("table", {{
                  className: "w-full text-center border-collapse text-xs min-w-full",
                  children: [
                    r.jsx("thead", {{
                      className: "sticky top-0 z-10",
                      children: r.jsxs("tr", {{
                        children: [
                          activeTable.columns.map(function(col, idx) {{
                            var isFirst = idx === 0;
                            return r.jsxs("th", {{
                              className: "bg-slate-100 p-1.5 font-bold text-slate-800 border-b border-l border-slate-200 text-center text-[11px] min-w-[95px]",
                              children: [
                                r.jsxs("div", {{
                                  className: "flex items-center justify-between gap-1 mb-1 px-1",
                                  children: [
                                    r.jsx("span", {{
                                      className: "text-[10px] text-slate-400 font-normal",
                                      children: isFirst ? "المقاس الأساسي" : ("عمود " + idx)
                                    }}),
                                    !isFirst && r.jsx("button", {{
                                      type: "button",
                                      onClick: function(e) {{ e.stopPropagation(); handleDeleteColumn(idx); }},
                                      title: "حذف هذا العمود (" + col + ")",
                                      className: "text-slate-400 hover:text-rose-600 hover:bg-rose-100 px-1 py-0.5 rounded transition-all cursor-pointer text-xs font-black",
                                      children: "✕"
                                    }})
                                  ]
                                }}),
                                r.jsx("input", {{
                                  type: "text",
                                  value: col,
                                  onChange: function(e) {{ handleHeaderChange(idx, e.target.value); }},
                                  title: "انقر لتعديل عنوان هذا العمود",
                                  placeholder: isFirst ? "المقاس" : "اسم القياس",
                                  className: "w-full text-center py-1 px-1 text-xs font-black text-slate-900 bg-white border border-slate-300 rounded shadow-2xs hover:border-blue-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 transition-all"
                                }})
                              ]
                            }}, idx);
                          }}),
                          r.jsx("th", {{
                            className: "bg-slate-100 p-2 font-black text-slate-800 border-b border-slate-200 w-12 text-center text-[10px]",
                            children: "حذف صف"
                          }})
                        ]
                      }})
                    }}),
                    r.jsx("tbody", {{
                      children: activeTable.rows.map(function(row, rIdx) {{
                        return r.jsxs("tr", {{
                          className: rIdx % 2 === 1 ? "bg-slate-50/50" : "bg-white",
                          children: [
                            row.map(function(cell, cIdx) {{
                              return r.jsx("td", {{
                                className: "p-1.5 border-b border-l border-slate-200 whitespace-nowrap",
                                children: r.jsx("input", {{
                                  type: "text",
                                  value: cell,
                                  onChange: function(e) {{ handleCellChange(rIdx, cIdx, e.target.value); }},
                                  className: "w-full text-center py-1 px-1.5 text-xs rounded border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all " + (cIdx === 0 ? "font-black text-slate-900 bg-slate-50/80" : "font-semibold text-slate-700 bg-white")
                                }})
                              }}, cIdx);
                            }}),
                            r.jsx("td", {{
                              className: "p-1 border-b border-slate-200 text-center",
                              children: r.jsx("button", {{
                                type: "button",
                                onClick: function() {{ handleDeleteRow(rIdx); }},
                                className: "p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer",
                                children: r.jsx(js, {{ className: "w-3.5 h-3.5 mx-auto" }})
                              }})
                            }})
                          ]
                        }}, rIdx);
                      }})
                    }})
                  ]
                }})
              }})
            ]
          }}),
          r.jsxs("div", {{
            className: "grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1",
            children: [
              r.jsxs("div", {{
                className: "space-y-1",
                children: [
                  r.jsx("label", {{
                    className: "block text-xs font-black text-slate-800",
                    children: "نوع القصة (Fit Type):"
                  }}),
                  r.jsxs("select", {{
                    value: fitType,
                    onChange: function(e) {{ handleUpdateFit(e.target.value); }},
                    className: "w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer",
                    children: [
                      r.jsx("option", {{ value: "tight", children: "قصة ضيقة (Tight)" }}),
                      r.jsx("option", {{ value: "regular", children: "قصة عادية (Regular)" }}),
                      r.jsx("option", {{ value: "oversized", children: "قصة كبيرة الحجم (Oversized)" }})
                    ]
                  }})
                ]
              }}),
              r.jsxs("div", {{
                className: "space-y-1",
                children: [
                  r.jsx("label", {{
                    className: "block text-xs font-black text-slate-800",
                    children: "المرونة (Stretch):"
                  }}),
                  r.jsxs("select", {{
                    value: stretch,
                    onChange: function(e) {{ handleUpdateStretch(e.target.value); }},
                    className: "w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer",
                    children: [
                      r.jsx("option", {{ value: "none", children: "غير مرن (Non-Stretch)" }}),
                      r.jsx("option", {{ value: "slight", children: "قليلاً (Slight Stretch)" }}),
                      r.jsx("option", {{ value: "medium", children: "متوسطة (Medium Stretch)" }}),
                      r.jsx("option", {{ value: "high", children: "للغاية (High Stretch)" }})
                    ]
                  }})
                ]
              }})
            ]
          }})
        ]
      }})
    ]
  }});
}};
"""

with open("helper_code_v2.js", "w", encoding="utf-8") as f:
    f.write(js_code.strip())

print("helper_code_v2.js regenerated successfully!")

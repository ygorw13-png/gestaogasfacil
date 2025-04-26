
export const excelStyles = {
  headerStyle: {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "22C55E" } }, // Verde GasFlow (gasflow-500)
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "15803D" } }, // gasflow-700
      bottom: { style: "thin", color: { rgb: "15803D" } },
      left: { style: "thin", color: { rgb: "15803D" } },
      right: { style: "thin", color: { rgb: "15803D" } }
    }
  },

  titleStyle: {
    font: { bold: true, size: 14, color: { rgb: "166534" } }, // gasflow-800
    fill: { fgColor: { rgb: "F0FDF4" } }, // gasflow-50
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "medium", color: { rgb: "15803D" } }, // gasflow-700
      bottom: { style: "medium", color: { rgb: "15803D" } },
      left: { style: "medium", color: { rgb: "15803D" } },
      right: { style: "medium", color: { rgb: "15803D" } }
    }
  },

  subHeaderStyle: {
    font: { bold: true, color: { rgb: "166534" } }, // gasflow-800
    fill: { fgColor: { rgb: "DCFCE7" } }, // gasflow-100
    alignment: { horizontal: "left" },
    border: {
      top: { style: "thin", color: { rgb: "16A34A" } }, // gasflow-600
      bottom: { style: "thin", color: { rgb: "16A34A" } },
      left: { style: "thin", color: { rgb: "16A34A" } },
      right: { style: "thin", color: { rgb: "16A34A" } }
    }
  },

  dataStyle: {
    font: { color: { rgb: "333333" } },
    border: {
      top: { style: "thin", color: { rgb: "BBBBBB" } },
      bottom: { style: "thin", color: { rgb: "BBBBBB" } },
      left: { style: "thin", color: { rgb: "BBBBBB" } },
      right: { style: "thin", color: { rgb: "BBBBBB" } }
    },
    alignment: { horizontal: "right", vertical: "center" }
  },

  dateStyle: {
    font: { color: { rgb: "333333" } },
    border: {
      top: { style: "thin", color: { rgb: "BBBBBB" } },
      bottom: { style: "thin", color: { rgb: "BBBBBB" } },
      left: { style: "thin", color: { rgb: "BBBBBB" } },
      right: { style: "thin", color: { rgb: "BBBBBB" } }
    },
    alignment: { horizontal: "center", vertical: "center" }
  },

  highlightStyle: {
    font: { bold: true, color: { rgb: "166534" } },
    fill: { fgColor: { rgb: "BBF7D0" } }, // gasflow-200
    border: {
      top: { style: "thin", color: { rgb: "16A34A" } },
      bottom: { style: "thin", color: { rgb: "16A34A" } },
      left: { style: "thin", color: { rgb: "16A34A" } },
      right: { style: "thin", color: { rgb: "16A34A" } }
    },
    alignment: { horizontal: "left", vertical: "center" }
  },

  footerStyle: {
    font: { italic: true, color: { rgb: "666666" } },
    alignment: { horizontal: "right" }
  }
};

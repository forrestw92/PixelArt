var pixelGrid = {
    multiChange: false,
    multiDelete: false,
    defaultColor: "#ffffff",
    tableContent: $("#pixel_canvas tbody"),
    fillMode: false,
    eraserMode: false,
    magicMode: false,
    width: 0,
    height: 0,
    coloredCellsInfo: [],
    gridBackgroundColor: $("#colorBackgroundPicker").val(),
    color: $("#colorPicker").val(),
    outlineColor: "",
    /**
     * @description Checks if browser supports Storage
     */
    checkSave: function() {
        if (typeof(Storage) !== "undefined") {
            if (localStorage.getItem("pixel-art-1") !== undefined) {
                return true;
            }
            return false;
        }
        return false;
    },
    /**
     * @description Load save table data from localStorage and update table.
     */
    loadSave: function() {
        if (this.checkSave()) {
            var gridInfo = $.parseJSON(localStorage.getItem("grid-info"));
            var json = $.parseJSON(localStorage.getItem("grid-cells-info"));
            var $this = this;
            if (gridInfo.width !== undefined && gridInfo.height !== undefined && gridInfo.gridBackgroundColor !== undefined) {
                $this.width = gridInfo.width;
                $this.height = gridInfo.height;
                $this.gridBackgroundColor = gridInfo.gridBackgroundColor;
                $this.makeGrid(true);
            }
            $.each(json, function(idx, obj) {
                if (obj.row !== undefined && obj.cell !== undefined && obj.color !== undefined) {
                    $this.addColor($("tr:nth-child(" + obj.row + ") td:nth-child(" + obj.cell + ")"), obj.color);
                }
            });
        }
    },
    /**
     * @description Store table data into localStorage
     */
    saveGrid: function() {
        var gridInfo = {
            width: this.width,
            height: this.height,
            gridBackgroundColor: this.gridBackgroundColor
        };
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("grid-info", JSON.stringify(gridInfo));
            localStorage.setItem("grid-cells-info", JSON.stringify(this.removeDuplicates(this.coloredCellsInfo)));
            this.coloredCellsInfo = this.removeDuplicates(this.coloredCellsInfo);
            addAlert("Saved Grid");
        } else {
            addAlert("Can not save grid");
        }
    },
    /**
     * @description Remove duplicates from object
     * @returns Array with no duplicates
     */
    removeDuplicates: function() {
        var uniq = new Set(this.coloredCellsInfo.map(e => JSON.stringify(e)));
        var out = Array.from(uniq).map(e => JSON.parse(e));
        return out;
    },
    /**
     * @description Remove table borders
     */
    removeBorders: function() {
        $("table, tr, td").css("border", "none");
    },
    /**
     * @description Adds table borders
     */
    addBorders: function() {
        $("table, tr, td").css("border", "1px solid black");
    },
    /**
     * @param {Object} cell - Table Cell
     * @param {string} color - New Cell Color
     */
    addColor: function(cell, color = this.color) {
        if ($(cell).css("backgroundColor") === hexToRgb(pixelGrid.color)) {
            return false
        };
        this.coloredCellsInfo.push({
            row: $(cell).parent().attr("id"),
            cell: $(cell).attr("id"),
            color: hexToRgb(pixelGrid.color)
        });
        if (this.magicMode === true) {
            if ($(cell).css("backgroundColor") === this.outlineColor) {
                $(cell).css("backgroundColor", color);
            }
        } else if (this.fillMode === true) {
            this.fillColor($(cell).css("backgroundColor"));
        } else {
            $(cell).css("backgroundColor", color);
        }
    },
    /**
     * @param {Object} cell - Table Cell
     * @description Removes cell color
     */
    removeColor: function(cell) {
        $(cell).css("background", this.defaultColor);
    },
    /**
     * @description Changes fill color from input[color]
     */
    changeColor: function() {
        if ($("#colorPicker").val() !== "#ffffff") {
            $("#eyedropper").css("backgroundColor", $("#colorPicker").val());
        }
        this.color = $("#colorPicker").val();
    },
    /**
     * @param {string} cellColor - Fill Color
     * @description Fills color of all same colored cells
     */
    fillColor: function(cellColor) {
        //loop table and find all table cells
        $(this.tableContent).find("td").each(function(i, row) {
            console.log(cellColor + ":::::" + $(row).css("backgroundColor"))
            if ($(row).css("backgroundColor") === cellColor) {
                $(row).css("backgroundColor", pixelGrid.color);
            }
        });
    },
    /**
     * @param {boolean} isLoadedFromSave - Is Loaded From Save
     * @description Generates a table with input from form for rows and columns
     * @yields Table Size and Color
     */
    makeGrid: function(isLoadedFromSave = false) {
        this.init(isLoadedFromSave);
        var table = "";
        for (row = 0; row < this.height; row++) {
            table += '<tr id="' + row + '">';
            for (col = 0; col < this.width; col++) {
                table += '<td style="background-color:' + this.gridBackgroundColor + '" id="' + col + '"></td>';
            }
            table += '</tr>';
        }
        $(this.tableContent).append(table);
    },
    /**
     * @param {boolean} isLoadedFromSave = Is Loaded From Save
     * @description Empty table and set variables from form
     */
    init: function(isLoadedFromSave) {
        $(this.tableContent).empty()
        if (!isLoadedFromSave) {
            this.height = $("#input_height").val();
            this.width = $("#input_width").val();
            this.gridBackgroundColor = $("#colorBackgroundPicker").val();
        }
        $("#eyedropper").css("backgroundColor", $("#colorPicker").val());
        $(".grid").removeClass("hide");
        setInterval(function() {
            pixelGrid.saveGrid();
        }, 60000);
    }
}
/**
 * @description Makes header font responsive
 */
$("#header").fitText(1, {
    maxFontSize: '70px'
}).fadeIn(3000).removeClass('hide');
/**
 * @param {string} hex - Hex Color Code
 * @returns {string} rgb color string
 */
function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#", ""), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return "rgb(" + r + ", " + g + ", " + b + ")";
}
/**
 * @param {string} string - Alert Text
 * @param {integer} time - Show Time In Miliseconds
 */
function addAlert(string, time = 1500) {
    $(".alert").removeClass("hide").children("span").text(string);
    setTimeout(function() {
        $(".alert").toggleClass('hide');
    }, time);
}
/**
 * @description Make table on form submit
 */
$("#sizePicker").on("submit", function(e) {
    e.preventDefault();
    pixelGrid.makeGrid();
});
/**
 * @description Detects input[color] changes
 */
$("#colorPicker").on("change", function() {
    pixelGrid.changeColor();
});
/**
 * @description Clicks hidden input[color]
 */
$("#eyedropper").click(function() {
    $("#colorPicker").click();
});
/**
 * @description Shows table overlay
 */
$("#show-overlay").click(function() {
    $(".grid").toggleClass("hide");
    $(this).toggleClass("hide");
});
/**
 * @description Reset all table cells color
 */
$("#refresh").click(function() {
    if (confirm("Are you sure you want to reset the grid?")) {
        pixelGrid.makeGrid();
    }
});
/**
 * @description Toggles touch/mouse click to remove cell colors instead of coloring cells
 */
$("#eraser").click(function() {
    if (pixelGrid.eraserMode === true) {
        addAlert("You left Eraser Mode");
        $(this).css("backgroundColor", "rgba(0, 0, 0, 0.5)");
        $(this).css("color", "#f49b95");
        pixelGrid.eraserMode = false
    } else {
        addAlert("You entered Eraser Mode");
        $(this).css("backgroundColor", "#f49b95");
        $(this).css("color", "#ffffff");
        pixelGrid.eraserMode = true;
    }
});
/**
 * @description Toggles change color of same clicked cell colors only.
 */
$("#magic").click(function() {
    if (pixelGrid.magicMode === true) {
        addAlert("You left Magic Mode");
        $(this).css("backgroundColor", "rgba(0, 0, 0, 0.5)");
        $(this).css("color", "#ffd700");
        pixelGrid.magicMode = false
    } else {
        addAlert("You entered Magic Mode");
        $(this).css("backgroundColor", "#ffd700");
        $(this).css("color", "#000000");
        pixelGrid.magicMode = true;
    }
});
/**
 * @description Toggles Fill mode to fill all same clicked cells color
 */
$("#pencil").click(function() {
    if (pixelGrid.fillMode === true) {
        addAlert("You left Fill Mode");
        $(this).css("backgroundColor", "rgba(0, 0, 0, 0.5)");
        $(this).css("color", "#ffffff");
        pixelGrid.fillMode = false
    } else {
        addAlert("You entered Fill Mode");
        $(this).css("backgroundColor", "#4CAF50");
        $(this).css("color", "#000000");
        pixelGrid.fillMode = true;
    }
});
/**
 * @description Hides table overlay
 */
$("#close").click(function() {
    $(".grid").toggleClass("hide");
    $("#show-overlay").toggleClass("hide");
});
/**
 * @description Load Save table data on click
 */
$("#load-save").click(function() {
    pixelGrid.loadSave();
});
/**
 * @description Generates a image from the table and saves to localStorage
 */
$("#save-button").click(function() {
    pixelGrid.saveGrid();
    pixelGrid.removeBorders();
    $("#gridImg").removeClass("hide");
    html2canvas($(pixelGrid.tableContent)[0]).then(function(canvas) {
        var img = canvas.toDataURL("image/png");
        pixelGrid.addBorders();
        var a = $("<a>").attr("href", img).attr("download", "pixel-art.png").appendTo("body");
        a[0].click();
        a.remove();
    });
});
$(pixelGrid.tableContent).on({
    /**
     * @description Detects touch of cell and adds or removes color
     */
    touchstart: function(e) {
        e.preventDefault();
        if (pixelGrid.eraserMode === true) {
            pixelGrid.multiDelete = true;
            pixelGrid.removeColor(e.target);
        } else {
            pixelGrid.multiChange = true;
            pixelGrid.outlineColor = $(e.target).css("backgroundColor");
            pixelGrid.addColor(e.target);
        }
    },
    /**
     * @description Detects touch move and finds element moved over and adds or removes color
     */
    touchmove: function(e) {
        var touchLocation = e.originalEvent.changedTouches[0];
        var targetFromPos = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
        if ($(targetFromPos).is("td")) {
            if (pixelGrid.multiChange === true) {
                pixelGrid.addColor(targetFromPos);
            }
            if (pixelGrid.multiDelete === true) pixelGrid.removeColor(targetFromPos);
        }
    },
    /**
     * @description Detects touch end and resets variables
     */
    touchend: function() {
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
    },
    /**
     * @description Detects mouse click and adds or removes color
     */
    mousedown: function(e) {
        e.preventDefault();
        if (e.which === 1) {
            if (pixelGrid.eraserMode === true) {
                pixelGrid.multiDelete = true;
                pixelGrid.removeColor(e.target);
            } else {
                pixelGrid.multiChange = true;
                pixelGrid.outlineColor = $(e.target).css("backgroundColor");
                pixelGrid.addColor(e.target);
            }
        } else if (e.which === 3) {
            pixelGrid.multiDelete = true;
            pixelGrid.removeColor(e.target);
        }
    },
    /**
     * @description Detects mouse click up resets variables
     */
    mouseup: function() {
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
    },
    /**
     * @description Detects mouse move and adds or removes color from cells moved over
     */
    mousemove: function(e) {
        if (pixelGrid.multiChange === true) pixelGrid.addColor(e.target);
        if (pixelGrid.multiDelete === true) pixelGrid.removeColor(e.target);
    }
});
/**
 * @description Assigns hotkeys for Magic Mode,Eraser Mode,Color Picker,Fill Mode
 */
$(document).on("keyup", function(e) {
    var key = e.which || e.keyCode;
    if (key === 67) $("#colorPicker").click();
    if (key === 69) $("#eraser").click();
    if (key === 70) $("#pencil").click();
    if (key === 16) $("#magic").click();
});
/**
 * @description Stops Right click menu from showing
 */
$(pixelGrid.tableContent).on("contextmenu", "td", function(e) {
    e.preventDefault();
});
/**
 * @description Set input[text] values based on screen width & height / cell height & width;
 */
$(function() {
    if (pixelGrid.checkSave()) $("#load-save").removeClass("hide");
    $("#input_width").val(Math.floor($(window).width() / 20)); //Sets the default val to the width of the window viewport /20(width of cells) and rounds down
    $("#input_height").val(Math.floor($(window).height() / 20)); //Sets the default val to the height of the window viewport /20(height of cells) and rounds down
    $("#input_width").attr("max", Math.floor($(window).width() / 20)); //Sets the max value for the width inputbox
    $("#input_height").attr("max", Math.floor($(window).height() / 20)); //Sets the max value for the height inputbox
});
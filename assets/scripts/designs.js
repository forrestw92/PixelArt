$("#header").fitText(1, {
    maxFontSize: '70px'
}).fadeIn(3000).removeClass('hide'); //Fluid header text width and fade in.
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
    //Checks if browser has storage and checks if the item is in storage returns true else false.
    checkSave: function() {
        if (typeof(Storage) !== "undefined") {
            if (localStorage.getItem("pixel-art-1") !== undefined) {
                return true;
            }
            return false;
        }
        return false;
    },
    loadSave: function() {
        if (typeof(Storage) !== "undefined") {
            if (localStorage.getItem("pixel-art-1") !== undefined) {
                var gridInfo = $.parseJSON(localStorage.getItem("grid-info")); //Parse JSON data from localStorage
                var json = $.parseJSON(localStorage.getItem("grid-cells-info"));
                var $this = this;
                if (gridInfo.width !== undefined && gridInfo.height !== undefined && gridInfo.gridBackgroundColor !== undefined) { //Make sure it is variables are defined in object
                    //Sets global variables and generates the grid.
                    $this.width = gridInfo.width;
                    $this.height = gridInfo.height;
                    $this.gridBackgroundColor = gridInfo.gridBackgroundColor;
                    $this.makeGrid(true);
                }
                $.each(json, function(idx, obj) { //Parses JSON from localStorage Item and loops each object
                    if (obj.row !== undefined && obj.cell !== undefined && obj.color !== undefined) { //Make sure each properties are defined
                        $this.addColor($("tr:nth-child(" + obj.row + ") td:nth-child(" + obj.cell + ")"), obj.color); //add color to cell
                    }
                });
            }
        }
    },
    saveGrid: function() {
        //Storing some grid info
        var gridInfo = {
            width: this.width,
            height: this.height,
            gridBackgroundColor: this.gridBackgroundColor
        };
        if (typeof(Storage) !== "undefined") {
            //Store info in JSON string
            localStorage.setItem("grid-info", JSON.stringify(gridInfo));
            localStorage.setItem("grid-cells-info", JSON.stringify(this.removeDuplicates(this.coloredCellsInfo)));
            this.coloredCellsInfo = this.removeDuplicates(this.coloredCellsInfo);
            addAlert("Saved Grid");
        } else {
            addAlert("Can not save grid");
        }
    },
    //remove Duplicate entrys.
    removeDuplicates: function() {
        var uniq = new Set(this.coloredCellsInfo.map(e => JSON.stringify(e)));
        var out = Array.from(uniq).map(e => JSON.parse(e));
        return out;
    },
    removeBorders: function() {
        $("table, tr, td").css("border", "none");
    },
    addBorders: function() {
        $("table, tr, td").css("border", "1px solid black");
    },
    addColor: function(cell, color = this.color) {
        //If shift key is pressed down
        if ($(cell).css("backgroundColor") === hexToRgb(pixelGrid.color)) {
            return false
        };
        //Adds new color to cell
        this.coloredCellsInfo.push({
            row: $(cell).parent().attr("id"),
            cell: $(cell).attr("id"),
            color: hexToRgb(pixelGrid.color)
        });
        if (this.magicMode === true) {
            //check if cell is white if so then set the new cell color
            if ($(cell).css("backgroundColor") === this.outlineColor) {
                $(cell).css("backgroundColor", color);
            }
        } else if (this.fillMode === true) { //if shift key is not pressed down then any cell color is overrided.
            this.fillColor($(cell).css("backgroundColor"));
        } else { //Regular cell fill
            $(cell).css("backgroundColor", color);
        }
    },
    removeColor: function(cell) {
        //Removes the background color and sets it to the default color.
        $(cell).css("background", this.defaultColor);
    },
    changeColor: function() {
        //On change of the color picker set the highlighted color to the value.
        if ($("#colorPicker").val() !== "#ffffff") {
            $("#eyedropper").css("backgroundColor", $("#colorPicker").val());
        }
        this.color = $("#colorPicker").val();
    },
    fillColor: function(cellColor) {
        //loop table and find all table cells
        $(this.tableContent).find("td").each(function(i, row) {
            console.log(cellColor+":::::"+$(row).css("backgroundColor"))
            if ($(row).css("backgroundColor") === cellColor) { //check if loops cell color equals clicked cell color
                $(row).css("backgroundColor", pixelGrid.color); //if so change to new color
            }
        });
    },
    makeGrid: function(isLoadedFromSave = false) {
        //Emptys and sets width,height of grid
        this.init(isLoadedFromSave);
        var table = "";
        //Loops the height from 0 to the submitted height - one(Index starts at 0)
        for (row = 0; row < this.height; row++) {
            //Adds the table row to the table variable
            table += '<tr id="' + row + '">';
            //Loops the width from 0 to the submitted width - one(Index starts at 0)
            for (col = 0; col < this.width; col++) {
                //Adds a table cell between table row
                table += '<td style="background-color:' + this.gridBackgroundColor + '" id="' + col + '"></td>';
            }
            //Closes table row and repeat
            table += '</tr>';
        }
        $(this.tableContent).append(table);
        setInterval(function() {
            pixelGrid.saveGrid();
        }, 60000);
    },
    init: function(isLoadedFromSave) {
        //Emptys contents of the table
        $(this.tableContent).empty()
        //Sets the height and width var's to the input values
        if (!isLoadedFromSave) {
            this.height = $("#input_height").val();
            this.width = $("#input_width").val();
            this.gridBackgroundColor = $("#colorBackgroundPicker").val();
        }
        $("#eyedropper").css("backgroundColor", $("#colorPicker").val());
        $("#canvasHeader").removeClass("hide"); //Show Design Canvas header
        $(".grid").removeClass("hide");
    }
}
//Function to generate rgb color from hex color(David from StackOverflow)
function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#", ""), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return "rgb(" + r + ", " + g + ", " + b + ")";
}
//Adds a Text overlay on top of the icon bar
function addAlert(string, time = 1500) {
    $(".alert").removeClass("hide").children("span").text(string);
    setTimeout(function() {
        $(".alert").toggleClass('hide');
    }, time);
}
//Once the form is submitted gather all input values and set them accordlying to their variables.
$("#sizePicker").on("submit", function(e) {
    //Stops the page from reloading.
    e.preventDefault();
    //Build the grid
    pixelGrid.makeGrid();
});
//Detects color picker change
$("#colorPicker").on("change", function() {
    //Calls changeColor and sets the color var to the selected color
    pixelGrid.changeColor();
});
$("#eyedropper").click(function() {
    $("#colorPicker").click();
});
$("#show-overlay").click(function() {
    $(".grid").toggleClass("hide");
    $(this).toggleClass("hide");
});
$("#refresh").click(function() {
    if (confirm("Are you sure you want to reset the grid?")) {
        pixelGrid.makeGrid();
    }
});
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
$("#close").click(function() {
    $(".grid").toggleClass("hide");
    $("#show-overlay").toggleClass("hide");
});
$("#load-save").click(function() {
    pixelGrid.loadSave();
});
$("#save-button").click(function() {
    pixelGrid.saveGrid();
    pixelGrid.removeBorders(); //removes table borders
    $("#gridImg").removeClass("hide"); //show the image div
    html2canvas($(pixelGrid.tableContent)[0]).then(function(canvas) { //Turn the table without borders into a canvas
        var img = canvas.toDataURL("image/png"); //Turn the canvas into a png image
        pixelGrid.addBorders(); //re add table borders
        var a = $("<a>").attr("href", img).attr("download", "pixel-art.png").appendTo("body");
        a[0].click();
        a.remove();
    });
});
$(pixelGrid.tableContent).on({
    //Once mouse is moved inside of the table
    touchstart: function(e) {
        e.preventDefault();
        if (pixelGrid.eraserMode === true) {
            pixelGrid.multiDelete = true; //Allow multi color remove
            pixelGrid.removeColor(e.target); //Removes the cells color
        } else {
            pixelGrid.multiChange = true; //Allow multi color change
            pixelGrid.outlineColor = $(e.target).css("backgroundColor"); //Gets cell color before change
            pixelGrid.addColor(e.target); //Change the cells color to the selected input color
        }
    },
    touchmove: function(e) {
        var touchLocation = e.originalEvent.changedTouches[0]; //Get first screen touch
        var targetFromPos = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY); //Get element from finger 2d positions
        if ($(targetFromPos).is("td")) { //checks if element under finger is a table cell
            if (pixelGrid.multiChange === true) {
                pixelGrid.addColor(targetFromPos);
            } //If left mouse is still down add color to all table cells it moves over.
            if (pixelGrid.multiDelete === true) pixelGrid.removeColor(targetFromPos); //if right mouse is still down remove color to all table cells it moves over.
        }
    },
    mousedown: function(e) {
        e.preventDefault();
        if (e.which === 1) { //If the left mouse button is down
            if (pixelGrid.eraserMode === true) {
                pixelGrid.multiDelete = true; //Allow multi color remove
                pixelGrid.removeColor(e.target); //Removes the cells color
            } else {
                pixelGrid.multiChange = true; //Allow multi color change
                pixelGrid.outlineColor = $(e.target).css("backgroundColor"); //Gets cell color before change
                pixelGrid.addColor(e.target); //Change the cells color to the selected input color
            }
        } else if (e.which === 3) { //If the mouse right button is down
            pixelGrid.multiDelete = true; //Allow multi color remove
            pixelGrid.removeColor(e.target); //Removes the cells color
        }
    },
    touchend: function() {
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
    },
    mouseup: function() { //On mouse click up reset multi change/delete variables.
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
    },
    mousemove: function(e) {
        if (pixelGrid.multiChange === true) pixelGrid.addColor(e.target); //If left mouse is still down add color to all table cells it moves over.
        if (pixelGrid.multiDelete === true) pixelGrid.removeColor(e.target); //if right mouse is still down remove color to all table cells it moves over.
    }
});
$(document).on("keydown keyup", function(e) {
    var key = e.which || e.keyCode;
    switch (e.type) {
        case "keydown":
            if (key === 67) $("#colorPicker").click(); //if key is "c" click color input
            if (key === 69) $("#eraser").click(); //if key is "e" enter eraser mode
            if (key === 70) $("#pencil").click(); //if key is "f" toggle fill mode
            if (key === 16) $("#magic").click(); //if key is "shift" toggle magic mode
            break;
    }
});
//Simpily stops the right click menu from popping up
$(pixelGrid.tableContent).on("contextmenu", "td", function(e) {
    e.preventDefault();
});
$(function() {
    if (pixelGrid.checkSave()) $("#load-save").removeClass("hide");
    $("#input_width").val(Math.floor($(window).width() / 20)); //Sets the default val to the width of the window viewport /20(width of cells) and rounds down
    $("#input_height").val(Math.floor($(window).height() / 20)); //Sets the default val to the height of the window viewport /20(height of cells) and rounds down
    $("#input_width").attr("max", Math.floor($(window).width() / 20)); //Sets the max value for the width inputbox
    $("#input_height").attr("max", Math.floor($(window).height() / 20)); //Sets the max value for the height inputbox
});
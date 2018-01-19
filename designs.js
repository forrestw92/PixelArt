$("#header").fitText(1, {
    maxFontSize: '70px'
}).fadeIn(3000).removeClass('hide'); //Fluid header text width and fade in.
var pixelGrid = {
    multiChange: false,
    multiDelete: false,
    defaultColor: "#ffffff",
    tableContent: $("#pixel_canvas tbody"),
    fillMode: false,
    width: 0,
    height: 0,
    allowOverlap: true,
    color: $("#colorPicker").val(),
    removeBorders: function() {
        $("table, tr, td").css("border", "none");
    },
    addBorders: function() {
        $("table, tr, td").css("border", "1px solid black");
    },
    addColor: function(cell) {
        //If shift key is pressed down
        if (pixelGrid.allowOverlap === false) {
            //check if cell is white if so then set the new cell color
            if ($(cell).css("backgroundColor") === "rgb(255, 255, 255)") {
                $(cell).css("backgroundColor", pixelGrid.color);
                pixelGrid.colorCounter++;
            }
        } else if (pixelGrid.fillMode === true) { //if shift key is not pressed down then any cell color is overrided.
            pixelGrid.fillColor($(cell).css("backgroundColor"));
        } else { //Regular cell fill
            $(cell).css("backgroundColor", pixelGrid.color);
            pixelGrid.colorCounter++;
        }
    },
    removeColor: function(cell) {
        //Removes the background color and sets it to the default color.
        $(cell).css("background", pixelGrid.defaultColor);
    },
    changeColor: function() {
        //On change of the color picker set the highlighted color to the value.
        pixelGrid.color = $("#colorPicker").val();
    },
    fillColor: function(cellColor) {
        //loop table and find all table cells
        $(pixelGrid.tableContent).find("td").each(function(i, row) {
            if ($(row).css("backgroundColor") === cellColor) { //check if loops cell color equals clicked cell color
                $(row).css("backgroundColor", pixelGrid.color); //if so change to new color
            }
        })
    },
    makeGrid: function() {
        //Emptys and sets width,height of grid
        pixelGrid.init();
        //Loops the height from 0 to the submitted height - one(Index starts at 0)
        for (row = 0; row < pixelGrid.height; row++) {
            //Appends table row(tr) to the table(id pixel_canvas);
            $(pixelGrid.tableContent).append("<tr id='" + row + "'>")
            //Loops the width from 0 to the submitted width - one(Index starts at 0)
            for (col = 0; col < pixelGrid.width; col++) {
                //Takes the last inserted table row and appends a table cell to the row(td);
                $(pixelGrid.tableContent).children("tbody tr:last").append("<td style='background:white' id='" + col + "'></td>")
            }
            //After appending the table cell(td) close the row then repeat;
            $(pixelGrid.tableContent).append("</tr>")
        }
    },
    init: function() {
        //Emptys contents of the table
        $(pixelGrid.tableContent).empty()
        //Sets the height and width var's to the input values
        pixelGrid.height = $("#input_height").val();
        pixelGrid.width = $("#input_width").val();
        $("#canvasHeader").removeClass("hide"); //Show Design Canvas header
    }
}
//Once the form is submitted gather all input values and set them accordlying to their variables.
$("#sizePicker").on("submit", function(e) {
    //Stops the page from reloading.
    e.preventDefault();
    //Build the grid
    pixelGrid.makeGrid();
    //Change the Submit button text to "Rebuild" after clicking
    $("#submit").text("Rebuild");
    $("p.hide").removeClass("hide");
})
//Detects color picker change
$("#colorPicker").on("change", function() {
    //Calls changeColor and sets the color var to the selected color
    pixelGrid.changeColor();
})

$(pixelGrid.tableContent).on({
    //Once mouse is moved inside of the table
    mousedown: function(e) {
        e.preventDefault();
        if (e.which === 1) { //If the left mouse button is down
            pixelGrid.multiChange = true; //Allow multi color change
            pixelGrid.addColor(e.target); //Change the cells color to the selected input color
        } else if (e.which === 3) { //If the mouse right button is down
            pixelGrid.multiDelete = true; //Allow multi color remove
            pixelGrid.removeColor(e.target); //Removes the cells color
        }
    },
    mouseup: function() { //On mouse click up reset multi change/delete variables.
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
    },
    mousemove: function(e) {
        if (pixelGrid.multiChange === true) pixelGrid.addColor(e.target); //If left mouse is still down add color to all table cells it moves over.
        if (pixelGrid.multiDelete === true) pixelGrid.removeColor(e.target); //if right mouse is still down remove color to all table cells it moves over.
    },
    mouseenter: function() { //if mouse leaves the table reset multi change/delete variables.
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
        pixelGrid.allowOverlap = true;
    }
})
$(document).on("keydown keyup", function(e) {
    var key = e.which || e.keyCode;
    switch (e.type) {
        case "keydown":
            if (key === 70) pixelGrid.fillMode = true; //if key is "f" enter fill mode
            if (key === 16) pixelGrid.allowOverlap = false; //if key is "shift" disallow overlap
            break;
        case "keyup":
            if (key === 70) pixelGrid.fillMode = false; //if key is "f" disable fill mode
            if (key === 16) pixelGrid.allowOverlap = true; //if key is "shift" allow overlap
            break;
    }
})
//Simpily stops the right click menu from popping up
$(pixelGrid.tableContent).on("contextmenu", "td", function(e) {
    e.preventDefault();
})
$("#save-button").click(function() {
    pixelGrid.removeBorders(); //removes table borders
    $("#gridImg").removeClass("hide"); //show the image div
    var imgWidth = pixelGrid.width * 20;//Gets the ammount of cells to create * 20(width of cell)
    var imgHeight = pixelGrid.height * 20;//Gets the ammount of cells to create * 20(height of cell)
    if (imgWidth > 512) imgWidth = 512;//if height is more than 512 then set it to 512
    if (imgHeight > 512) imgHeight = 512;//if height is more than 512 then set it to 512
    html2canvas($(pixelGrid.tableContent)[0], {
        width: imgWidth,//Sets the canvas width to the calc width
        height: imgHeight//Sets the canvas height to the calc width
    }).then(function(canvas) { //Turn the table without borders into a canvas
        var img = canvas.toDataURL("image/png"); //Turn the canvas into a png image
        $('#img').attr('src', img).fadeIn(2000); //set the source of the tmp image to the base64 png image and fade it in
        pixelGrid.addBorders(); //re add table borders
    });
});
$("#hideImage").click(function() {
    $("#gridImg").addClass("hide"); //hide image
})
$(document).ready(function() {
    $("#input_width").val(Math.floor($(window).width() / 20));//Sets the default val to the width of the window viewport /20(width of cells) and rounds down
    $("#input_height").val(Math.floor($(window).height() / 20));//Sets the default val to the height of the window viewport /20(height of cells) and rounds down
    $("#input_width").attr("max",Math.floor($(window).width() / 20));//Sets the max value for the width inputbox
    $("#input_height").attr("max",Math.floor($(window).height() / 20));//Sets the max value for the height inputbox
})
var pixelGrid = {
    tableContent: document.getElementById("pixel_canvas"),
    width: 0,
    height: 0,
    multiChange: false,
    multiDelete: false,
    eraserMode: false,
    magicMode: false,
    fillMode: false,
    didUndoLast: false,
    fillCount: 0,
    colorCount: 0,
    coloredCellsInfo: [],
    undoCellsInfo: [],
    gridBackgroundColor: "rgb(255, 255, 255)",
    color: "rgb(0, 0, 0)",
    colorFill: "",
    outlineColor: "",
    /**
     * @description Checks if browser supports Storage
     */
    checkSave() {
        if (typeof(Storage) !== "undefined") {
            if (localStorage.getItem("grid-cells-info") !== undefined) {
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
        document.querySelector(".grid").classList.remove("hide");
        let gridInfo = JSON.parse(localStorage.getItem("grid-info"));
        let json = JSON.parse(localStorage.getItem("grid-cells-info"));
        const $this = this;
        if (gridInfo.width !== undefined && gridInfo.height !== undefined && gridInfo.gridBackgroundColor !== undefined) {
            $this.width = gridInfo.width;
            $this.height = gridInfo.height;
            $this.gridBackgroundColor = gridInfo.gridBackgroundColor;
            $this.makeGrid(true);
        }
        let total = json.length;
        json.map((obj, index) => {
            setTimeout(function() {
                let cell = document.querySelector(`tr:nth-child(${obj.row}) td:nth-child(${obj.col})`);
                let color = obj.color;
                $this.addColor(cell, color);
                document.querySelector(".progress").style.width = (index / total * 100).toFixed(0) + "%";
                document.querySelector(".loadingScreen span").textContent = (index / total * 100).toFixed(0) + "%";
                if (((index / total * 100).toFixed(0)) == 100 || index == total - 1) {
                    document.querySelector(".loadingScreen").style.transition = "opacity .5s ease-in-out";
                    document.querySelector(".loadingScreen").style.opacity = 0;
                    utils.toolBoxFix();
                    setTimeout(function() {
                        document.querySelector(".loadingScreen").parentNode.removeChild(document.querySelector(".loadingScreen"));
                    }, 500);
                }
            }, 0);
        });
    },
    /**
     * @description Store table data into localStorage
     */
    saveGrid() {
        if (typeof(Storage) !== "undefined") {
            localStorage.setItem("grid-info", "");
            localStorage.setItem("grid-cells-info", "");
            let cellInfo = [];
            let gridInfo = {
                width: this.width,
                height: this.height,
                gridBackgroundColor: this.gridBackgroundColor
            };
            this.coloredCellsInfo.map(obj => cellInfo.push({
                row: obj.cell.parentNode.rowIndex + 1,
                col: obj.cell.cellIndex + 1,
                color: obj.color,
            }));
            localStorage.setItem("grid-info", JSON.stringify(gridInfo));
            localStorage.setItem("grid-cells-info", JSON.stringify(cellInfo));
        }
    },
    /**
     * @description Redo's last cell changes
     */
    redoCellChange() {
        if (this.undoCellsInfo.length === 0) {
            return false;
        }
        this.didUndoLast = false;
        let lastCellID = this.undoCellsInfo[this.undoCellsInfo.length - 1].id;
        for (let index = this.undoCellsInfo.length - 1; index >= 0; --index) {
            if (this.undoCellsInfo[index].id !== lastCellID) {
                break;
            }
            this.addColor(this.undoCellsInfo[index].cell, this.undoCellsInfo[index].color);
            this.undoCellsInfo.splice(-1, 1);
        }
        this.colorCount++;
    },
    /**
     * @description Replaces last colored cell(s) with previous color
     */
    undoLastChange() {
        if (this.coloredCellsInfo.length === 0) {
            return false;
        }
        this.didUndoLast = true;
        let lastCellID = this.coloredCellsInfo[this.coloredCellsInfo.length - 1].id;
        for (let index = this.coloredCellsInfo.length - 1; index >= 0; --index) {
            if (this.coloredCellsInfo[index].id !== lastCellID) {
                break;
            }
            let id = this.coloredCellsInfo[index].id;
            let cell = this.coloredCellsInfo[index].cell;
            let oldColor = this.coloredCellsInfo[index].oldColor;
            let color = this.coloredCellsInfo[index].color;
            this.undoCellsInfo.push({
                id,
                cell,
                oldColor,
                color,
            });
            this.coloredCellsInfo.splice(-1, 1);
            cell.style.backgroundColor = oldColor;
        }
    },
    /**
     * @description Sets selected cells color
     * @param {Object} cell - Table Cell
     */
    setCellColor(cell, color, oldColor = false) {
        cell.style.backgroundColor = color;
        if (this.undoCellsInfo.length !== 0 && this.didUndoLast === true) {
            this.undoCellsInfo = [];
        }
        this.coloredCellsInfo.push({
            id: this.colorCount,
            cell: cell,
            color,
            oldColor
        });
    },
    /**
     * @description Adds Color to cell
     * @param {Object} cell - Table Cell
     * @param {string} color - New Cell Color
     */
    addColor(cell, color = this.color) {
        if (cell.style.backgroundColor === this.color && (this.fillMode === true && cell.style.backgroundColor === this.colorFill)) {
            return false;
        }
        if (this.magicMode === true) {
            if (cell.style.backgroundColor === this.outlineColor) {
                this.setCellColor(cell, color, cell.style.backgroundColor);
            }
        } else if (this.fillMode === true) {
            this.fillColor(cell, cell.style.backgroundColor);
        } else {
            this.setCellColor(cell, color, cell.style.backgroundColor);
        }
        return false;
    },
    resetColor(cell) {
        this.addColor(cell, this.gridBackgroundColor);
    },
    /**
     * @param {Object} cell - Clicked cell
     * @param {string} cellColorToFill - The Color of the cell to fill
     * @description Finds path of same colored cells and fills
     */
    fillColor(cell, cellColorToFill) {
        if (cell.style.backgroundColor === this.colorFill) {
            return false;
        }
        let cellsToBeChecked = [cell];
        let checkCellForColor = [];
        do {
            checkCellForColor = cellsToBeChecked[cellsToBeChecked.length - 1];
            cellsToBeChecked.pop();
            if (checkCellForColor.style.backgroundColor === cellColorToFill) {
                if (checkCellForColor.previousSibling !== null) {
                    cellsToBeChecked.push(checkCellForColor.previousSibling); //bottom cell
                }
                if (checkCellForColor.nextSibling !== null) {
                    cellsToBeChecked.push(checkCellForColor.nextSibling); //bottom cell
                }
                if (checkCellForColor.parentNode.previousSibling !== null && (checkCellForColor.parentNode.previousSibling.rowIndex < this.tableContent.rows.length && checkCellForColor.parentNode.previousSibling.rowIndex >= 0)) {
                    cellsToBeChecked.push(checkCellForColor.parentNode.previousSibling.cells[checkCellForColor.cellIndex]); //top cell
                }
                if (checkCellForColor.parentNode.nextSibling !== null && checkCellForColor.parentNode.nextSibling.rowIndex < this.tableContent.rows.length && checkCellForColor.parentNode.nextSibling.rowIndex >= 0) {
                    cellsToBeChecked.push(checkCellForColor.parentNode.nextSibling.cells[checkCellForColor.cellIndex]); //bottom cell
                }
                this.setCellColor(checkCellForColor, this.colorFill, cellColorToFill);
            }
        } while (cellsToBeChecked.length > 0);
        this.fillCount++;
        return true;
    },
    /**
     * @param {boolean} isLoadedFromSave - Is Loaded From Save
     * @description Generates a table with input from form for rows and columns
     * @yields Table Size and Color
     */
    makeGrid(isLoadedFromSave = false) {
        this.coloredCellsInfo = [];
        this.init(isLoadedFromSave);
        for (let row = 0; row < this.height; row++) {
            let aRow = this.tableContent.insertRow(row);
            for (let col = 0; col < this.width; col++) {
                let aCell = aRow.insertCell(col);
                aCell.style.backgroundColor = this.gridBackgroundColor;
            }
        }
        document.querySelectorAll("td").forEach(el => ['touchstart', 'touchmove', 'touchend', 'mousedown', 'mouseup', 'mouseleave', 'mouseenter', 'contextmenu'].forEach(event => utils.addEventListen(el, event, utils.eventListen)));
        return true;
    },
    /**
     * @param {boolean} isLoadedFromSave = Is Loaded From Save
     * @description Empty table and set variables from form
     */
    init(isLoadedFromSave) {
        this.tableContent.innerHTML = "";
        if (!isLoadedFromSave) {
            this.height = document.getElementById("input_height").value;
            this.width = document.getElementById("input_width").value;
        }
        utils.addEventListen(document.querySelector(".boxItems"), "click", utils.toolBar);
        utils.addEventListen(document, "keyup", utils.keyListen);
        utils.addEventListen(document, "mouseleave", utils.clearDrawingVars);
        setInterval(function() {
            pixelGrid.saveGrid();
        }, 60000);
    }
};
var utils = {
    eventListen(e) {
        switch (e.type) {
            /**
             * @description Detects touch of cell and adds or removes color
             */
            case "touchstart":
                e.preventDefault();
                if (pixelGrid.eraserMode === true) {
                    pixelGrid.multiDelete = true;
                    pixelGrid.resetColor(e.target);
                } else {
                    pixelGrid.multiChange = true;
                    pixelGrid.outlineColor = e.target.style.backgroundColor;
                    pixelGrid.addColor(e.target);
                }
                break;
                /**
                 * @description Detects touch move and finds element moved over and adds or removes color
                 */
            case "touchmove":
                let touchLocation = e.changedTouches[0];
                let targetFromPos = document.elementFromPoint(touchLocation.screenX, touchLocation.screenY);
                if (pixelGrid.multiChange === true) {
                    pixelGrid.addColor(e.target);
                }
                if (pixelGrid.multiDelete === true) {
                    pixelGrid.resetColor(targetFromPos);
                }
                break;
                /**
                 * @description Detects touch end and resets variables
                 */
            case "touchend":
                break;
                /**
                 * @description Detects mouse click and adds or removes color
                 */
            case "mousedown":
                e.preventDefault();
                if (e.which === 1) {
                    if (pixelGrid.eraserMode === true) {
                        pixelGrid.multiDelete = true;
                        pixelGrid.resetColor(e.target);
                    } else {
                        pixelGrid.multiChange = true;
                        pixelGrid.outlineColor = e.target.style.backgroundColor;
                        pixelGrid.addColor(e.target);
                    }
                } else if (e.which === 3) {
                    pixelGrid.multiDelete = true;
                    pixelGrid.resetColor(e.target);
                }
                break;
                /**
                 * @description Detects mouse click up resets variables
                 */
            case "mouseup":
                pixelGrid.multiChange = false;
                pixelGrid.multiDelete = false;
                pixelGrid.colorCount++;
                break;
            case "mouseleave":
                e.target.style.backgroundImage = "";
                break;
                /**
                 * @description Detects mouse move and adds or removes color from cells moved over
                 */
            case "mouseenter":
                if (pixelGrid.multiChange === true) {
                    pixelGrid.addColor(e.target);
                }
                if (pixelGrid.multiDelete === true) {
                    pixelGrid.resetColor(e.target);
                }
                if (pixelGrid.eraserMode) {
                    let color = utils.getHexContrast(utils.rgbToHex(e.target.style.backgroundColor));
                    let bgImage = `linear-gradient(to bottom left, transparent calc(50% - 1px), ${color}, transparent calc(50% + 1px)),linear-gradient(to bottom right, transparent calc(50% - 1px), ${color}, transparent calc(50% + 1px))`;
                    e.target.style.backgroundImage = bgImage;
                } else {
                    let bgImage = `linear-gradient(to bottom left, transparent calc(50% - 1px), ${pixelGrid.color}, transparent calc(50% + 1px)),linear-gradient(to bottom right, transparent calc(50% - 1px), ${pixelGrid.color}, transparent calc(50% + 1px))`;
                    e.target.style.backgroundImage = bgImage;
                }
                break;
            case "contextmenu":
                return false;
        }
    },
    /**
     * @param {object} el = Element to add event listener
     * @param {string} event = Event to listen for
     * @param {object} func = Callback for event listener
     * @description Empty table and set variables from form
     */
    addEventListen(el, event, func) {
        if (el.addEventListener) {
            el.addEventListener(event, function(e) {
                func(e);
            }, false);
        } else if (el.attachEvent) {
            el.attachEvent("on" + event, function(e) {
                func(e);
            });
        }
    },
    /**
     * @description Fixed toolBar button height and centers text
     */
    toolBoxFix() {
        let toolBarMaxHeight = window.innerHeight - document.getElementById("pixel_canvas").offsetHeight + 1;
        if (toolBarMaxHeight > 50) {
            return false;
        }
        document.querySelector(".toolBox").style.height = toolBarMaxHeight + "px";
        document.querySelector(".toolBox").style.lineHeight = toolBarMaxHeight + "px";
    },
    rgbToHex(rgbStr) {
        let rgb = rgbStr.replace("rgb(", "").replace(")", "").split(",");
        let rnt = rgb[2] | (rgb[1] << 8) | (rgb[0] << 16);
        return '#' + (0x1000000 + rnt).toString(16).slice(1);
    },
    hexToRGB(hex) {
        let bigint = parseInt(hex.replace("#", ""), 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        return "rgb(" + r + ", " + g + ", " + b + ")";
    },
    /**
     * @description Checks and sees if hex color is bright or dark
     * @param {string} hex - Hex Color Code
     * @returns {string} Black or White hex
     */
    getHexContrast(hex) {
        hex = hex.replace("#", "");
        let r = parseInt(hex.substr(0, 2), 16);
        let g = parseInt(hex.substr(2, 2), 16);
        let b = parseInt(hex.substr(4, 2), 16);
        let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#ffffff';
    },
    /**
     * @description Turns off all modes
     * @param {string} modeName - Mode to keep on
     */
    clearModes(modeName) {
        let pixelModes = ["fillMode", "magicMode", "eraserMode"];
        let modesID = ["fill", "magic", "eraser"];
        modesID.forEach(function(mode, index) { //loops left over modes
            if (mode !== modeName) {
                pixelGrid[pixelModes[index]] = false; //sets them to false
                document.getElementById(mode).classList.remove("active"); //removes left over modes active class
            }
        });
    },
    isModesOn() {
        if (pixelGrid.fillMode === true || pixelGrid.magicMode === true || pixelGrid.eraserMode === true) {
            return true;
        }
        return false;
    },
    /**
     * @description Toggles active modes
     */
    toggleMode(mode, value = "") {
        let pixelModes = ["fillMode", "magicMode", "eraserMode"];
        let modesID = ["fill", "magic", "eraser"];
        let curMode = pixelModes[modesID.indexOf(mode)];
        if (mode !== "pencil") {
            document.getElementById("pencil").classList.remove("active");
            this.clearModes(mode);
        } else {
            this.clearModes(mode);
        }
        if (mode !== "fill") {
            document.getElementById("fill").style.backgroundColor = "";
            document.getElementById("fill").querySelector("img").setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAANZSURBVFhH7ZdNSFRhFIbtRzFKpCKhRVGQuahoUWRlZiERWGQQLQokspBaGCht2rsr7IcIbNEuqE2KG8tFuQmiQNy0LCgjJKLMzP7HnvPd945zx7kz986M0MIHXr7vO+c95zs4c2ecknkKZXp6elEikViP9qMmzsfROqXnHi7djLrQM/STywMQ+8SyTfa5gUtq0COU8K4NB8tntF2lxYXGx9CU7nJw/ogGUTd6onAq48R3qEVxoGEtSr4c7O2v08y2VPkW9Ee5v+ih7YUNtNM1KgY0HLKudhFLm8IOYumDtCrebTFhA+12BYVAo2U0cu8RlvsKOzhnHMSH81XLGey/oDql8oMGG9XPGnYpnHMQH+LpA7WjFUrHg8IK9EvNnrIsQKXsr6E3KHQQw/zmtXofzpPI3vSrZYsORb3qY416WMqVslyVtqHgnzWQQWwCdbJdLGtuKNhAwbjrAJxfoQtopSw5ocwGuu51CEL8OctaWXNDQerT4SBmL9Ew6kEd6ARqRFtRMxpBr9Fp60GJDXTDqw5C3D6zDrjLsoG3DaP/RNkA7j0UFfz2RnffV6zZBvqODrpLM0HyMEodpBWtQufQA/TBdcoBvnq19Ae66WWCEJ9CDbLOQK6cxDuZjLDHtwrVYzvKegZdQo+tzmA/wlImu4NztoFGWZbL6kHwkJd2htsKR4IS+9fC/qon0VKFA+CxgW65C9Igflc2DwL22DnYNypcNGhbRt8+74bZkKuV1Q3TrrglmhQuCrTMOohB/p7sbphaxS3Rr3DB0C7nIAYe+6Re4hfZazrspVzysksUAG0Cg7B/j/rRW4UCEN+lUvfX2UIs9dP3ilKxoTzTIDXKLWRvX77fvKwHZ/eBmYTYHoITXjq/gSgLHSQVYkdkcXDuVGoG4jbQV88SbyDskQbxITcgq3k7FA5Coh5NyhdpIGyxBjHIn5Ld/OcVng3JvSj5urIPHYh07EEMPNUqsZoWhTODoQFlHYhwXoMY+CpUZnXhX5w++PZhTB3oDkul5divQYNeJt4gPvh/qDZaHUb7SZs60G80ipI/8tjGHsSgZgzZA+N+DkUCsz1lY+7mNIi/RNWyxoLyIWr7dIwOhZUUXkQD6AXqRWeJB/5tiAP1dWiTjvP875SU/ANPe9xthZlndAAAAABJRU5ErkJggg==");
        }
        if (value === true) {
            pixelGrid[curMode] = true;
        } else {
            if (pixelGrid[curMode] === true) {
                document.getElementById(mode).classList.remove("active");
                pixelGrid[curMode] = false;
            } else {
                pixelGrid[curMode] = true;
                document.getElementById(mode).classList.add("active");
            }
        }
        if (!this.isModesOn()) {
            document.getElementById("pencil").classList.add("active");
        }
    },
    /**
     * @description Tool bar item listener
     */
    toolBar(e) {
        let id = e.target.id;
        if (e.target.tagName.toLowerCase() === "i" || e.target.tagName.toLowerCase() === "span") {
            id = e.target.parentNode.id;
        }
        switch (id) {
            case "pencil":
                if (utils.isModesOn()) {
                    utils.toggleMode(id);
                }
                break;
            case "eraser":
                utils.toggleMode(id);
                break;
            case "magic":
                utils.toggleMode(id);
                break;
            case "image-button":
                utils.gridToImage();
                break;
            case "undo":
                pixelGrid.undoLastChange();
                break;
            case "refresh":
                if (confirm("Are you sure you want to refresh grid?")) {
                    pixelGrid.makeGrid();
                }
                break;
            case "redo":
                pixelGrid.redoCellChange();
                break;
            case "save-data":
                pixelGrid.saveGrid();
                break;
        }
    },
    /**
     * @description Assigns hotkeys for Magic Mode,Eraser Mode,Color Picker,Fill Mode
     */
    keyListen(e) {
        let key = e.which || e.keyCode;
        if (key === 67) {
            document.getElementById("colorPicker").click();
        }
        if (key === 69) {
            utils.toggleMode("eraser");
        }
        if (key === 70) {
            document.getElementById("fill").click();
        }
        if (key === 16) {
            utils.toggleMode("magic");
        }
    },
    clearDrawingVars() {
        pixelGrid.multiChange = false;
        pixelGrid.multiDelete = false;
    },
    /**
     * @description Generates a image from the table and saves to localStorage
     */
    gridToImage() {
        pixelGrid.saveGrid();
        document.querySelectorAll("tr, td").forEach(element => element.style.border = "none");
        html2canvas(pixelGrid.tableContent).then(function(canvas) {
            let img = canvas.toDataURL("image/png");
            document.querySelectorAll("tr, td").forEach(element => element.style.border = "1px solid black");
            let a = document.createElement("a");
            a.id = "download";
            a.href = img;
            a.download = "pixel-art.png";
            a.click();
        });
    }
};
utils.addEventListen(document.querySelector(".toolBox"), "click", function(e) {
    if (!e.target.classList.contains("item") && !e.target.classList.contains("boxItems") && !e.target.classList.contains("fa") && e.target.tagName !== 'IMG' && e.target.tagName !== 'SPAN') {
        if (document.querySelector(".boxItems").classList.contains("hideBox")) {
            document.querySelector(".boxItems").classList.remove("hideBox");
            document.querySelector(".boxItems span").textContent = "Hide Toolbar";
        } else {
            document.querySelector(".boxItems").classList.add("hideBox");
            document.querySelector(".boxItems span").textContent = "Show Toolbar";
        }
    }
})
/**
 * @description Load saved table data on button click
 */
utils.addEventListen(document.getElementById("hasSaved"), "click", function() {
    document.querySelector(".loadingScreen").style.display = "flex";
    setTimeout(function() {
        pixelGrid.loadSave();
    }, 50);
});
/**
 * @description Re-shows main menu boxes
 */
utils.addEventListen(document.getElementById("mainMenu"), "click", function() {
    document.querySelectorAll(".innerBox")[0].classList.remove("animate-out-left");
    document.querySelectorAll(".innerBox")[1].classList.remove("animate-out-right");
    document.querySelectorAll(".innerBox")[2].classList.remove("animate-out-left");
    if (pixelGrid.checkSave()) {
        document.querySelectorAll(".innerBox")[3].classList.remove("animate-out-left");
    }
    document.querySelector(".grid").classList.add("hide");
    document.getElementById("header").textContent = "Pixel Art Maker";
});
/**
 * @description Animate main menu boxes and creates grid
 */
utils.addEventListen(document.getElementById("sizePicker"), "submit", function(e) {
    e.preventDefault();
    document.querySelectorAll(".innerBox")[0].classList.add("animate-out-left");
    document.querySelectorAll(".innerBox")[1].classList.add("animate-out-right");
    document.querySelectorAll(".innerBox")[2].classList.add("animate-out-left");
    if (pixelGrid.checkSave()) {
        document.querySelectorAll(".innerBox")[3].classList.add("animate-out-left");
    }
    document.getElementById("header").textContent = "Let's Make Art";
    if (pixelGrid.makeGrid()) {
        document.querySelector(".grid").classList.remove("hide");
        utils.toolBoxFix();
    }
});
/**
 * @description Changes max grid size and sets max size in inputs on window resize
 */
utils.addEventListen(window, "resize", function() {
    document.getElementById("input_width").value = Math.floor(window.innerWidth / 20);
    document.getElementById("input_height").value = Math.floor(window.innerHeight / 20) - 1;
    document.getElementById("input_width").setAttribute("max", Math.floor(window.innerWidth / 20));
    document.getElementById("input_height").setAttribute("max", Math.floor(window.innerHeight / 20) - 1);
    utils.toolBoxFix();
}, false);
/**
 * @description Shows overlay when orientation changes.
 */
utils.addEventListen(window, "orientationchange", function() {
    document.querySelector(".rotateDevice").classList.toggle("hide");
}, false);
/**
 * @description Initializes data when page is loaded
 */
utils.addEventListen(document, 'DOMContentLoaded', function() {
    if (pixelGrid.checkSave()) {
        document.getElementById("hasSaved").style.display = "block";
    }
    $("#colorPicker").spectrum({
        preferredFormat: "rgb",
        color: "#000000",
        containerClassName: '',
        localStorageKey: "pixelGrid",
        showInput: true,
        showPalette: true,
        palette: [],
        showSelectionPalette: true,
        selectionPalette: ["red", "green", "blue"],
        maxSelectionSize: 5,
        move(color) {
            document.getElementById("colorPicker").style.backgroundColor = color.toRgbString();
            document.getElementById("colorPicker").style.color = color.toRgbString();
            document.getElementById("colorPicker").classList.add("active");
            pixelGrid.color = color.toRgbString();
        },
        change(color) {
            document.getElementById("colorPicker").style.backgroundColor = color.toRgbString();
            document.getElementById("colorPicker").style.color = color.toRgbString();
            document.getElementById("colorPicker").classList.add("active");
            pixelGrid.color = color.toRgbString();
        }
    });
    $("#fill").spectrum({
        preferredFormat: "rgb",
        color: "#000000",
        containerClassName: '',
        localStorageKey: "pixelGrid",
        showInput: true,
        showPalette: true,
        palette: [],
        showSelectionPalette: true,
        selectionPalette: ["red", "green", "blue"],
        maxSelectionSize: 5,
        move(color) {
            document.getElementById("fill").style.backgroundColor = color.toRgbString();
            document.getElementById("fill").style.color = utils.getHexContrast(color.toHexString());
            document.getElementById("fill").children[0].setAttribute("src", utils.getHexContrast(color.toHexString()) === "#ffffff" ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAANZSURBVFhH7ZdNSFRhFIbtRzFKpCKhRVGQuahoUWRlZiERWGQQLQokspBaGCht2rsr7IcIbNEuqE2KG8tFuQmiQNy0LCgjJKLMzP7HnvPd945zx7kz986M0MIHXr7vO+c95zs4c2ecknkKZXp6elEikViP9qMmzsfROqXnHi7djLrQM/STywMQ+8SyTfa5gUtq0COU8K4NB8tntF2lxYXGx9CU7nJw/ogGUTd6onAq48R3qEVxoGEtSr4c7O2v08y2VPkW9Ee5v+ih7YUNtNM1KgY0HLKudhFLm8IOYumDtCrebTFhA+12BYVAo2U0cu8RlvsKOzhnHMSH81XLGey/oDql8oMGG9XPGnYpnHMQH+LpA7WjFUrHg8IK9EvNnrIsQKXsr6E3KHQQw/zmtXofzpPI3vSrZYsORb3qY416WMqVslyVtqHgnzWQQWwCdbJdLGtuKNhAwbjrAJxfoQtopSw5ocwGuu51CEL8OctaWXNDQerT4SBmL9Ew6kEd6ARqRFtRMxpBr9Fp60GJDXTDqw5C3D6zDrjLsoG3DaP/RNkA7j0UFfz2RnffV6zZBvqODrpLM0HyMEodpBWtQufQA/TBdcoBvnq19Ae66WWCEJ9CDbLOQK6cxDuZjLDHtwrVYzvKegZdQo+tzmA/wlImu4NztoFGWZbL6kHwkJd2htsKR4IS+9fC/qon0VKFA+CxgW65C9Igflc2DwL22DnYNypcNGhbRt8+74bZkKuV1Q3TrrglmhQuCrTMOohB/p7sbphaxS3Rr3DB0C7nIAYe+6Re4hfZazrspVzysksUAG0Cg7B/j/rRW4UCEN+lUvfX2UIs9dP3ilKxoTzTIDXKLWRvX77fvKwHZ/eBmYTYHoITXjq/gSgLHSQVYkdkcXDuVGoG4jbQV88SbyDskQbxITcgq3k7FA5Coh5NyhdpIGyxBjHIn5Ld/OcVng3JvSj5urIPHYh07EEMPNUqsZoWhTODoQFlHYhwXoMY+CpUZnXhX5w++PZhTB3oDkul5divQYNeJt4gPvh/qDZaHUb7SZs60G80ipI/8tjGHsSgZgzZA+N+DkUCsz1lY+7mNIi/RNWyxoLyIWr7dIwOhZUUXkQD6AXqRWeJB/5tiAP1dWiTjvP875SU/ANPe9xthZlndAAAAABJRU5ErkJggg==" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKwSURBVFhH7ddLyA1hHMfx1zVCQpQFUS4LZEHu1ySFULKgJJfEgiIbeztyS4qFnWKDbFwW2ChRsrGkXJIk9/v9++X9n5533nPmzJn3vLLwq0/eZp6Z83PmeWbOtPxPE9INIzEfi7EKI/DXMh57cAOf8TPjBSahUzMWl/AD2QJZLzEZnZKV+ID0A5/jMvbjauu21CtMQVMzFenl8NtZjh4wa/EN7vuOi61/R6FpaFquIT5osxuSZItsgPHbSgvNQIfTFzFHTrshSa0ikQOIQq8xEx3KGMQJXUGRekUi2ULbMBCl0g9f4MmuowucKwfxAHlFjOMdG4X0Dl7GoWg4ZxEnOoZeiAxp/Tcv1QrpDXaiOwpnFJyEcZJ72I5BKBoLHUJaJtzEcBROujqCl+g2/LZ2YDUWYCJc+ndwH+thLHQY2fPIe9ZC1I3LOVaUBWIOFeVEj+dVXqGPWISaWYq0iJN1MLbgDJ4he9JqZiNioSOoNs67/Fy0ixP1MRxkoVqrxknsh63ARuzGFcQHeLl6Ik1eoUcYgDZZghhw3A0NxJ8Wfqtr0McNVWKho0iLhJNoE5dd7HRiNjt+W+eQlkj5TKzEu2Xs8IdTM1OviE6hEpvFjvNuaFKKFJF36t74Ha+p95HYuRcdTbbIE/gffZhsS01HJROQ3n33oWyqFfHXo+kKH77vEfsVN8xKZsHnSAwoUyivSJpliDFyEbWLhd4iBjVSqGiRyAXEWB8zVeONzUkVA4sUarSIWYcYv9UNtTIH6XXNK1SmiBmNOMZ5lBufHfUKlS1i/EEXx+U+OCPzkBY6gf4ww+ArTOxrpEjkEzy28HG+0qaFvsKHXPqSV6aIeQoXTLwOFYqrzAPjw1N34fUvE1+PvMwNx8uzCy7JW/A38yY4b8rG15pxf/78n38+LS2/AJUMUFYb7b3KAAAAAElFTkSuQmCC");
            utils.toggleMode("fill", true);
            pixelGrid.colorFill = color.toRgbString();
        },
        change(color) {
            document.getElementById("fill").style.backgroundColor = color.toRgbString();
            document.getElementById("fill").style.color = utils.getHexContrast(color.toHexString());
            document.getElementById("fill").children[0].setAttribute("src", utils.getHexContrast(color.toHexString()) === "#ffffff" ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAANZSURBVFhH7ZdNSFRhFIbtRzFKpCKhRVGQuahoUWRlZiERWGQQLQokspBaGCht2rsr7IcIbNEuqE2KG8tFuQmiQNy0LCgjJKLMzP7HnvPd945zx7kz986M0MIHXr7vO+c95zs4c2ecknkKZXp6elEikViP9qMmzsfROqXnHi7djLrQM/STywMQ+8SyTfa5gUtq0COU8K4NB8tntF2lxYXGx9CU7nJw/ogGUTd6onAq48R3qEVxoGEtSr4c7O2v08y2VPkW9Ee5v+ih7YUNtNM1KgY0HLKudhFLm8IOYumDtCrebTFhA+12BYVAo2U0cu8RlvsKOzhnHMSH81XLGey/oDql8oMGG9XPGnYpnHMQH+LpA7WjFUrHg8IK9EvNnrIsQKXsr6E3KHQQw/zmtXofzpPI3vSrZYsORb3qY416WMqVslyVtqHgnzWQQWwCdbJdLGtuKNhAwbjrAJxfoQtopSw5ocwGuu51CEL8OctaWXNDQerT4SBmL9Ew6kEd6ARqRFtRMxpBr9Fp60GJDXTDqw5C3D6zDrjLsoG3DaP/RNkA7j0UFfz2RnffV6zZBvqODrpLM0HyMEodpBWtQufQA/TBdcoBvnq19Ae66WWCEJ9CDbLOQK6cxDuZjLDHtwrVYzvKegZdQo+tzmA/wlImu4NztoFGWZbL6kHwkJd2htsKR4IS+9fC/qon0VKFA+CxgW65C9Igflc2DwL22DnYNypcNGhbRt8+74bZkKuV1Q3TrrglmhQuCrTMOohB/p7sbphaxS3Rr3DB0C7nIAYe+6Re4hfZazrspVzysksUAG0Cg7B/j/rRW4UCEN+lUvfX2UIs9dP3ilKxoTzTIDXKLWRvX77fvKwHZ/eBmYTYHoITXjq/gSgLHSQVYkdkcXDuVGoG4jbQV88SbyDskQbxITcgq3k7FA5Coh5NyhdpIGyxBjHIn5Ld/OcVng3JvSj5urIPHYh07EEMPNUqsZoWhTODoQFlHYhwXoMY+CpUZnXhX5w++PZhTB3oDkul5divQYNeJt4gPvh/qDZaHUb7SZs60G80ipI/8tjGHsSgZgzZA+N+DkUCsz1lY+7mNIi/RNWyxoLyIWr7dIwOhZUUXkQD6AXqRWeJB/5tiAP1dWiTjvP875SU/ANPe9xthZlndAAAAABJRU5ErkJggg==" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKwSURBVFhH7ddLyA1hHMfx1zVCQpQFUS4LZEHu1ySFULKgJJfEgiIbeztyS4qFnWKDbFwW2ChRsrGkXJIk9/v9++X9n5533nPmzJn3vLLwq0/eZp6Z83PmeWbOtPxPE9INIzEfi7EKI/DXMh57cAOf8TPjBSahUzMWl/AD2QJZLzEZnZKV+ID0A5/jMvbjauu21CtMQVMzFenl8NtZjh4wa/EN7vuOi61/R6FpaFquIT5osxuSZItsgPHbSgvNQIfTFzFHTrshSa0ikQOIQq8xEx3KGMQJXUGRekUi2ULbMBCl0g9f4MmuowucKwfxAHlFjOMdG4X0Dl7GoWg4ZxEnOoZeiAxp/Tcv1QrpDXaiOwpnFJyEcZJ72I5BKBoLHUJaJtzEcBROujqCl+g2/LZ2YDUWYCJc+ndwH+thLHQY2fPIe9ZC1I3LOVaUBWIOFeVEj+dVXqGPWISaWYq0iJN1MLbgDJ4he9JqZiNioSOoNs67/Fy0ixP1MRxkoVqrxknsh63ARuzGFcQHeLl6Ik1eoUcYgDZZghhw3A0NxJ8Wfqtr0McNVWKho0iLhJNoE5dd7HRiNjt+W+eQlkj5TKzEu2Xs8IdTM1OviE6hEpvFjvNuaFKKFJF36t74Ha+p95HYuRcdTbbIE/gffZhsS01HJROQ3n33oWyqFfHXo+kKH77vEfsVN8xKZsHnSAwoUyivSJpliDFyEbWLhd4iBjVSqGiRyAXEWB8zVeONzUkVA4sUarSIWYcYv9UNtTIH6XXNK1SmiBmNOMZ5lBufHfUKlS1i/EEXx+U+OCPzkBY6gf4ww+ArTOxrpEjkEzy28HG+0qaFvsKHXPqSV6aIeQoXTLwOFYqrzAPjw1N34fUvE1+PvMwNx8uzCy7JW/A38yY4b8rG15pxf/78n38+LS2/AJUMUFYb7b3KAAAAAElFTkSuQmCC");
            utils.toggleMode("fill", true);
            pixelGrid.colorFill = color.toRgbString();
        }
    });
    $("#colorBackgroundPicker").spectrum({
        color: "#ffffff",
        preferredFormat: "rgb",
        showInput: true,
        move(color) {
            document.getElementById("colorBackgroundPicker").style.backgroundColor = color.toRgbString();
            document.getElementById("colorBackgroundPicker").style.color = utils.getHexContrast(color.toRgbString());
            document.getElementById("colorBackgroundPicker").textContent = color.toHexString();
            pixelGrid.gridBackgroundColor = color.toRgbString();
        },
        change(color) {
            document.getElementById("colorBackgroundPicker").style.backgroundColor = color.toRgbString();
            document.getElementById("colorBackgroundPicker").style.color = utils.getHexContrast(color.toRgbString());
            document.getElementById("colorBackgroundPicker").textContent = color.toHexString();
            pixelGrid.gridBackgroundColor = color.toRgbString();
        }
    });
    document.getElementById("input_width").value = Math.floor(window.innerWidth / 20);
    document.getElementById("input_height").value = Math.floor(window.innerHeight / 20) - 1;
    document.getElementById("input_width").setAttribute("max", Math.floor(window.innerWidth / 20));
    document.getElementById("input_height").setAttribute("max", Math.floor(window.innerHeight / 20) - 1);
}, false);
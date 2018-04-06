var pixelGrid = {
	tableContent: $("#pixel_canvas tbody"),
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
		if (typeof (Storage) !== "undefined") {
			if (localStorage.getItem("grid-cells-info") !== undefined && localStorage.getItem("grid-cells-info") !== null) {
				return true;
			}
			return false;
		}
		return false;
	},
	/**
	 * @description Load save table data from localStorage and update table.
	 */
	loadSave: function () {
		let gridInfo = $.parseJSON(localStorage.getItem("grid-info"));
		let json = $.parseJSON(localStorage.getItem("grid-cells-info"));
		const $this = this;
		if (gridInfo.width !== undefined && gridInfo.height !== undefined && gridInfo.gridBackgroundColor !== undefined) {
			$this.width = gridInfo.width;
			$this.height = gridInfo.height;
			$this.gridBackgroundColor = gridInfo.gridBackgroundColor;
			$this.makeGrid(true);
		}
		let total = json.length;
		$.map(json, function (obj, index) {
			let color = "";
			let cell = "";
			setTimeout(function () {
				cell = $(`tr:nth-child(${obj.row}) td:nth-child(${obj.col})`);
				color = obj.color;
				$this.addColor(cell, color);
				$(".progress").css("width", (index / total * 100).toFixed(0) + "%");
				$(".loadingScreen span").text((index / total * 100).toFixed(0) + "%");
				if (((index / total * 100).toFixed(0)) == 100 || index == total - 1) {
					$(".loadingScreen").fadeOut(500);
				}
			}, 0);
		});
	},
	/**
	 * @description Store table data into localStorage
	 */
	saveGrid() {
		if (typeof (Storage) !== "undefined") {
			localStorage.setItem("grid-info", "");
			localStorage.setItem("grid-cells-info", "");
			let cellInfo = [];
			let gridInfo = {
				width: this.width,
				height: this.height,
				gridBackgroundColor: this.gridBackgroundColor
			};
			$.map(this.coloredCellsInfo, function (obj, idx) {
				cellInfo.push({
					row: $(obj.cell).parent("tr").index() + 1,
					col: $(obj.cell).index() + 1,
					color: obj.color,
				});
			});
			localStorage.setItem("grid-info", JSON.stringify(gridInfo));
			localStorage.setItem("grid-cells-info", JSON.stringify(cellInfo));
		}
	},
	checkIfCellStored(cell, color) {
		for (const index in this.coloredCellsInfo) {
			if (this.coloredCellsInfo[index].cell === cell && this.coloredCellsInfo[index].color === color) {
				return true
			}
		}
	},
	/**
	 * @description Remove duplicates from object
	 * @returns Array with no duplicates
	 */
	removeDuplicates(array) {
		var uniq = new Set(array.map(e => JSON.stringify(e)));
		var out = Array.from(uniq).map(e => JSON.parse(e));
		return out;
	},
	removeBorders() {
		$("table, tr, td").css("border", "none");
	},
	addBorders() {
		$("table, tr, td").css("border", "1px solid black");
	},
	/**
	 * @description Redo's last cell changes
	 */
	redoCellChange() {
		if (this.undoCellsInfo.length === 0) return false;
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
			$(cell).css("backgroundColor", oldColor);
		}
	},
	/**
	 * @description Sets selected cells color
	 * @param {Object} cell - Table Cell
	 */
	setCellColor(cell, color, oldColor = false) {
		$(cell).css("backgroundColor", color);
		this.deleteOldUndos();
		this.coloredCellsInfo.push({
			id: this.colorCount,
			cell: $(cell),
			color,
			oldColor
		});
	},
	deleteOldUndos() {
		if (this.undoCellsInfo.length !== 0 && this.didUndoLast == true) {
			this.undoCellsInfo = [];
		}
	},
	/**
	 * @description Adds Color to cell
	 * @param {Object} cell - Table Cell
	 * @param {string} color - New Cell Color
	 */
	addColor(cell, color = this.color) {
		if ($(cell).css("backgroundColor") === this.color && (this.fillMode === true && $(cell).css("backgroundColor") === this.colorFill)) {
			return false;
		}
		if (this.magicMode === true) {
			if ($(cell).css("backgroundColor") === this.outlineColor) {
				this.setCellColor($(cell), color, $(cell).css("backgroundColor"));
				return true;
			}
		} else if (this.fillMode === true) {
			this.fillColor($(cell), $(cell).css("backgroundColor"));
			return true;
		} else {
			this.setCellColor($(cell), color, $(cell).css("backgroundColor"));
			return true;
		}
		return false;
	},
	removeColor(cell) {
		this.addColor($(cell), this.gridBackgroundColor);
	},
	changeColor() {
		$("#eyedropper").css("backgroundColor", $("#colorPicker").val());
		$("#eyedropper").css("color", utils.getHexContrast($("#colorPicker").val()));
		this.color = utils.hexToRGB($("#colorPicker").val());
	},
	/**
	 * @param {Object} cell - Clicked cell
	 * @param {string} cellColorToFill - The Color of the cell to fill
	 * @description Finds path of same colored cells and fills
	 */
	fillColor(cell, cellColorToFill) {
		if ($(cell).css("backgroundColor") === this.colorFill) {
			return false;
		}
		let cellsToBeChecked = [$(cell)];
		let checkCellForColor = [];
		do {
			checkCellForColor = cellsToBeChecked[cellsToBeChecked.length - 1];
			cellsToBeChecked.pop();
			if ($(checkCellForColor[0]).css("backgroundColor") === cellColorToFill) {
				cellsToBeChecked.push([$(checkCellForColor[0]).prev()]);
				cellsToBeChecked.push([$(checkCellForColor[0]).next()]);
				cellsToBeChecked.push([$(checkCellForColor[0]).closest('tr').prev().find("td").eq($(checkCellForColor[0]).index())]);
				cellsToBeChecked.push([$(checkCellForColor[0]).closest('tr').next().find("td").eq($(checkCellForColor[0]).index())]);
				this.setCellColor($(checkCellForColor[0]), this.colorFill, cellColorToFill);
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
		let tableStr = "";
		for (let row = 0; row < this.height; row++) {
			tableStr += "<tr>";
			for (let col = 0; col < this.width; col++) {
				tableStr += "<td style='background-color:" + this.gridBackgroundColor + "'></td>";
			}
		}
		$(this.tableContent).append(tableStr);
		utils.toolBoxFix();
	},
	/**
	 * @param {boolean} isLoadedFromSave = Is Loaded From Save
	 * @description Empty table and set variables from form
	 */
	init(isLoadedFromSave) {
		$(this.tableContent).empty()
		if (!isLoadedFromSave) {
			this.height = $("#input_height").val();
			this.width = $("#input_width").val();
		}
		$("#eyedropper").css("backgroundColor", $("#colorPicker").val());
		$(".grid").removeClass("hide");
		setInterval(function () {
			pixelGrid.saveGrid();
		}, 60000);
	}
}
var utils = {
	toolBoxFix() {
		let toolBarMaxHeight = $(window).height() - $("#pixel_canvas").height() - 4;
		if (toolBarMaxHeight > 50) {
			console.log("HII")
			return false;
		}
		$(".toolBox").css("height", toolBarMaxHeight + "px");
		$(".toolBox").css("line-height", toolBarMaxHeight + "px");

	},
	rgbToHex(rgbStr) {
		let rgb = rgbStr.replace("rgb(", "").replace(")", "").split(",");
		let rnt = rgb[2] | (rgb[1] << 8) | (rgb[0] << 16);
		return '#' + (0x1000000 + rnt).toString(16).slice(1)
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
	 */
	clearModes(modeName) {
		let pixelModes = ["fillMode", "magicMode", "eraserMode"];
		let modesID = ["fill", "magic", "eraser"];
		modesID.forEach(function (mode, index) { //loops left over modes
			if (mode !== modeName) {
				pixelGrid[pixelModes[index]] = false; //sets them to false
				$("#" + mode).removeClass("active"); //removes left over modes active class
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
	 * @description Generates a image from the table and saves to localStorage
	 */
	gridToImage() {
		pixelGrid.saveGrid();
		pixelGrid.removeBorders();
		$("#gridImg").removeClass("hide");
		html2canvas($(pixelGrid.tableContent)[0]).then(function (canvas) {
			let img = canvas.toDataURL("image/png");
			pixelGrid.addBorders();
			let a = $("<a>").attr("href", img).attr("download", "pixel-art.png").appendTo("body");
			a[0].click();
			a.remove();
		});
	},
	toggleMode(mode, value = "") {
		let pixelModes = ["fillMode", "magicMode", "eraserMode"];
		let modesID = ["fill", "magic", "eraser"];
		let curMode = pixelModes[modesID.indexOf(mode)];
		if (mode !== "pencil") {
			$("#pencil").removeClass("active");
			this.clearModes(mode);
		} else {
			this.clearModes(mode);
		}
		if (mode !== "fill") {
			$("#fill").css("backgroundColor", "");
			$("#fill").children("img").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAANZSURBVFhH7ZdNSFRhFIbtRzFKpCKhRVGQuahoUWRlZiERWGQQLQokspBaGCht2rsr7IcIbNEuqE2KG8tFuQmiQNy0LCgjJKLMzP7HnvPd945zx7kz986M0MIHXr7vO+c95zs4c2ecknkKZXp6elEikViP9qMmzsfROqXnHi7djLrQM/STywMQ+8SyTfa5gUtq0COU8K4NB8tntF2lxYXGx9CU7nJw/ogGUTd6onAq48R3qEVxoGEtSr4c7O2v08y2VPkW9Ee5v+ih7YUNtNM1KgY0HLKudhFLm8IOYumDtCrebTFhA+12BYVAo2U0cu8RlvsKOzhnHMSH81XLGey/oDql8oMGG9XPGnYpnHMQH+LpA7WjFUrHg8IK9EvNnrIsQKXsr6E3KHQQw/zmtXofzpPI3vSrZYsORb3qY416WMqVslyVtqHgnzWQQWwCdbJdLGtuKNhAwbjrAJxfoQtopSw5ocwGuu51CEL8OctaWXNDQerT4SBmL9Ew6kEd6ARqRFtRMxpBr9Fp60GJDXTDqw5C3D6zDrjLsoG3DaP/RNkA7j0UFfz2RnffV6zZBvqODrpLM0HyMEodpBWtQufQA/TBdcoBvnq19Ae66WWCEJ9CDbLOQK6cxDuZjLDHtwrVYzvKegZdQo+tzmA/wlImu4NztoFGWZbL6kHwkJd2htsKR4IS+9fC/qon0VKFA+CxgW65C9Igflc2DwL22DnYNypcNGhbRt8+74bZkKuV1Q3TrrglmhQuCrTMOohB/p7sbphaxS3Rr3DB0C7nIAYe+6Re4hfZazrspVzysksUAG0Cg7B/j/rRW4UCEN+lUvfX2UIs9dP3ilKxoTzTIDXKLWRvX77fvKwHZ/eBmYTYHoITXjq/gSgLHSQVYkdkcXDuVGoG4jbQV88SbyDskQbxITcgq3k7FA5Coh5NyhdpIGyxBjHIn5Ld/OcVng3JvSj5urIPHYh07EEMPNUqsZoWhTODoQFlHYhwXoMY+CpUZnXhX5w++PZhTB3oDkul5divQYNeJt4gPvh/qDZaHUb7SZs60G80ipI/8tjGHsSgZgzZA+N+DkUCsz1lY+7mNIi/RNWyxoLyIWr7dIwOhZUUXkQD6AXqRWeJB/5tiAP1dWiTjvP875SU/ANPe9xthZlndAAAAABJRU5ErkJggg==");
		}
		if (value === true) {
			pixelGrid[curMode] = true;
		} else {
			if (pixelGrid[curMode] === true) {
				$("#" + mode).removeClass("active");
				pixelGrid[curMode] = false;
			} else {
				pixelGrid[curMode] = true;
				$("#" + mode).addClass("active");
			}
		}
		if (!this.isModesOn()) {
			$("#pencil").addClass("active");
		}
	}
}
$(".boxItems").on("click", ".item", function (e) {
	let id = $(this).attr("id");
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
			console.log("pixelGrid.saveGrid();")
			pixelGrid.saveGrid();
			break;
	}
});
let oldColor = "";
let mouseDown = false;
$(pixelGrid.tableContent).on({
	/**
	 * @description Detects touch of cell and adds or removes color
	 */
	touchstart: function (e) {
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
	touchmove: function (e) {
		let touchLocation = e.originalEvent.changedTouches[0];
		let targetFromPos = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);
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
	touchend: function () {
		pixelGrid.multiChange = false;
		pixelGrid.multiDelete = false;
		pixelGrid.colorCount++;
	},
	/**
	 * @description Detects mouse click and adds or removes color
	 */
	mousedown: function (e) {
		e.preventDefault();
		mouseDown = true;
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
	mouseup: function (e) {
		mouseDown = false;
		pixelGrid.multiChange = false;
		pixelGrid.multiDelete = false;
		pixelGrid.colorCount++;
	},
	mouseleave: function (e) {
		$(this).css("background-image", "");
	},
	/**
	 * @description Detects mouse move and adds or removes color from cells moved over
	 */
	mouseenter: function (e) {
		if (pixelGrid.multiChange === true) pixelGrid.addColor($(this));
		if (pixelGrid.multiDelete === true) pixelGrid.removeColor($(this));
		if (pixelGrid.eraserMode) {
			let color = utils.getHexContrast(utils.rgbToHex($(this).css("backgroundColor")));
			let bgImage = `linear-gradient(to bottom left, transparent calc(50% - 1px), ${color}, transparent calc(50% + 1px)),linear-gradient(to bottom right, transparent calc(50% - 1px), ${color}, transparent calc(50% + 1px))`;
			$(this).css("background-image", bgImage)
		} else {
			let bgImage = `linear-gradient(to bottom left, transparent calc(50% - 1px), ${pixelGrid.color}, transparent calc(50% + 1px)),linear-gradient(to bottom right, transparent calc(50% - 1px), ${pixelGrid.color}, transparent calc(50% + 1px))`;
			$(this).css("background-image", bgImage);
		}
	}
}, "td");
/**
 * @description Assigns hotkeys for Magic Mode,Eraser Mode,Color Picker,Fill Mode
 */
$(document).on("keyup", function (e) {
	let key = e.which || e.keyCode;
	if (key === 67) $("#colorPicker").click();
	if (key === 69) utils.toggleMode("eraser");
	if (key === 70) $("#fill").click();
	if (key === 16) utils.toggleMode("magic");
});
$(pixelGrid.tableContent).on({
	contextmenu: function () {
		return false;
	},
	mouseleave: function () {
		pixelGrid.multiChange = false;
		pixelGrid.multiDelete = false;
	}
});
$(".toolBox").on("click", function (e) {
	if (!e.target.classList.contains("item") && !e.target.classList.contains("boxItems") && !e.target.classList.contains("fa") && e.target.tagName !== 'IMG') {
		if ($(".boxItems").hasClass("hideBox")) {
			$(".boxItems").removeClass("hideBox");
			$(this).children("span").html("Hide Toolbar");
		} else {
			$(".boxItems").addClass("hideBox");
			$(this).children("span").html("Show Toolbar");

		}
	}
})
$("#hasSaved").on("click", function () {
	$(".loadingScreen").css("display", "flex");
	setTimeout(function () {
		pixelGrid.loadSave();
	}, 50);
})
$("#mainMenu").on("click", function () {
	$(".innerBox:nth-child(1)").removeClass("animate-out-left");
	$(".innerBox:nth-child(2)").removeClass("animate-out-right");
	$(".innerBox:nth-child(3)").removeClass("animate-out-left");
	if (pixelGrid.checkSave()) {
		$(".innerBox:nth-child(4)").removeClass("animate-out-right");
	}
	$(".grid").addClass("hide");
	$('#header').text("Pixel Art Maker").fadeIn(1500);
})
/**
 * @description Make table on form submit
 */
$("#sizePicker").on("submit", function (e) {
	e.preventDefault();
	$(".innerBox:nth-child(1)").addClass("animate-out-left");
	$(".innerBox:nth-child(2)").addClass("animate-out-right");
	$(".innerBox:nth-child(3)").addClass("animate-out-left");
	if (pixelGrid.checkSave()) {
		$(".innerBox:nth-child(4)").addClass("animate-out-right");
	}
	$('#header').text("Let's Make Art").fadeOut(1500);
	setTimeout(function () {
		pixelGrid.makeGrid();
	}, 1000);
});
$(window).resize(function () {
	$("#input_width").val(Math.floor($(window).width() / 20));
	$("#input_height").val(Math.floor($(window).height() / 20) - 1);
	$("#input_width").attr("max", Math.floor($(window).width() / 20));
	$("#input_height").attr("max", Math.floor($(window).height() / 20) - 1);
	utils.toolBoxFix();
});
$(window).on("orientationchange", function () {
	$(".rotateDevice").toggleClass("hide");
})
$(document).mouseleave(function () {
	pixelGrid.multiChange = false;
	pixelGrid.multiDelete = false;
});
$(document).ready(function () {
	if (pixelGrid.checkSave()) {
		$("#hasSaved").css("display", "block");
		//pixelGrid.loadSave()
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
		move: function (color) {
			$(this).css("backgroundColor", color.toRgbString());
			$(this).css("color", utils.getHexContrast(color.toHexString()));
			$(this).addClass("active");
			pixelGrid.color = color.toRgbString();
		},
		change: function (color) {
			$(this).css("backgroundColor", color.toRgbString());
			$(this).css("color", utils.getHexContrast(color.toHexString()));
			$(this).addClass("active");
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
		move: function (color) {
			$(this).css("backgroundColor", color.toRgbString());
			$(this).css("color", utils.getHexContrast(color.toHexString()));
			$(this).children("img").attr("src", utils.getHexContrast(color.toHexString()) === "#ffffff" ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAANZSURBVFhH7ZdNSFRhFIbtRzFKpCKhRVGQuahoUWRlZiERWGQQLQokspBaGCht2rsr7IcIbNEuqE2KG8tFuQmiQNy0LCgjJKLMzP7HnvPd945zx7kz986M0MIHXr7vO+c95zs4c2ecknkKZXp6elEikViP9qMmzsfROqXnHi7djLrQM/STywMQ+8SyTfa5gUtq0COU8K4NB8tntF2lxYXGx9CU7nJw/ogGUTd6onAq48R3qEVxoGEtSr4c7O2v08y2VPkW9Ee5v+ih7YUNtNM1KgY0HLKudhFLm8IOYumDtCrebTFhA+12BYVAo2U0cu8RlvsKOzhnHMSH81XLGey/oDql8oMGG9XPGnYpnHMQH+LpA7WjFUrHg8IK9EvNnrIsQKXsr6E3KHQQw/zmtXofzpPI3vSrZYsORb3qY416WMqVslyVtqHgnzWQQWwCdbJdLGtuKNhAwbjrAJxfoQtopSw5ocwGuu51CEL8OctaWXNDQerT4SBmL9Ew6kEd6ARqRFtRMxpBr9Fp60GJDXTDqw5C3D6zDrjLsoG3DaP/RNkA7j0UFfz2RnffV6zZBvqODrpLM0HyMEodpBWtQufQA/TBdcoBvnq19Ae66WWCEJ9CDbLOQK6cxDuZjLDHtwrVYzvKegZdQo+tzmA/wlImu4NztoFGWZbL6kHwkJd2htsKR4IS+9fC/qon0VKFA+CxgW65C9Igflc2DwL22DnYNypcNGhbRt8+74bZkKuV1Q3TrrglmhQuCrTMOohB/p7sbphaxS3Rr3DB0C7nIAYe+6Re4hfZazrspVzysksUAG0Cg7B/j/rRW4UCEN+lUvfX2UIs9dP3ilKxoTzTIDXKLWRvX77fvKwHZ/eBmYTYHoITXjq/gSgLHSQVYkdkcXDuVGoG4jbQV88SbyDskQbxITcgq3k7FA5Coh5NyhdpIGyxBjHIn5Ld/OcVng3JvSj5urIPHYh07EEMPNUqsZoWhTODoQFlHYhwXoMY+CpUZnXhX5w++PZhTB3oDkul5divQYNeJt4gPvh/qDZaHUb7SZs60G80ipI/8tjGHsSgZgzZA+N+DkUCsz1lY+7mNIi/RNWyxoLyIWr7dIwOhZUUXkQD6AXqRWeJB/5tiAP1dWiTjvP875SU/ANPe9xthZlndAAAAABJRU5ErkJggg==" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKwSURBVFhH7ddLyA1hHMfx1zVCQpQFUS4LZEHu1ySFULKgJJfEgiIbeztyS4qFnWKDbFwW2ChRsrGkXJIk9/v9++X9n5533nPmzJn3vLLwq0/eZp6Z83PmeWbOtPxPE9INIzEfi7EKI/DXMh57cAOf8TPjBSahUzMWl/AD2QJZLzEZnZKV+ID0A5/jMvbjauu21CtMQVMzFenl8NtZjh4wa/EN7vuOi61/R6FpaFquIT5osxuSZItsgPHbSgvNQIfTFzFHTrshSa0ikQOIQq8xEx3KGMQJXUGRekUi2ULbMBCl0g9f4MmuowucKwfxAHlFjOMdG4X0Dl7GoWg4ZxEnOoZeiAxp/Tcv1QrpDXaiOwpnFJyEcZJ72I5BKBoLHUJaJtzEcBROujqCl+g2/LZ2YDUWYCJc+ndwH+thLHQY2fPIe9ZC1I3LOVaUBWIOFeVEj+dVXqGPWISaWYq0iJN1MLbgDJ4he9JqZiNioSOoNs67/Fy0ixP1MRxkoVqrxknsh63ARuzGFcQHeLl6Ik1eoUcYgDZZghhw3A0NxJ8Wfqtr0McNVWKho0iLhJNoE5dd7HRiNjt+W+eQlkj5TKzEu2Xs8IdTM1OviE6hEpvFjvNuaFKKFJF36t74Ha+p95HYuRcdTbbIE/gffZhsS01HJROQ3n33oWyqFfHXo+kKH77vEfsVN8xKZsHnSAwoUyivSJpliDFyEbWLhd4iBjVSqGiRyAXEWB8zVeONzUkVA4sUarSIWYcYv9UNtTIH6XXNK1SmiBmNOMZ5lBufHfUKlS1i/EEXx+U+OCPzkBY6gf4ww+ArTOxrpEjkEzy28HG+0qaFvsKHXPqSV6aIeQoXTLwOFYqrzAPjw1N34fUvE1+PvMwNx8uzCy7JW/A38yY4b8rG15pxf/78n38+LS2/AJUMUFYb7b3KAAAAAElFTkSuQmCC");
			pixelGrid.colorFill = color.toRgbString();
		},
		change: function (color) {
			$(this).css("backgroundColor", color.toRgbString());
			$(this).css("color", utils.getHexContrast(color.toHexString()));
			$(this).children("img").attr("src", utils.getHexContrast(color.toHexString()) === "#ffffff" ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAANZSURBVFhH7ZdNSFRhFIbtRzFKpCKhRVGQuahoUWRlZiERWGQQLQokspBaGCht2rsr7IcIbNEuqE2KG8tFuQmiQNy0LCgjJKLMzP7HnvPd945zx7kz986M0MIHXr7vO+c95zs4c2ecknkKZXp6elEikViP9qMmzsfROqXnHi7djLrQM/STywMQ+8SyTfa5gUtq0COU8K4NB8tntF2lxYXGx9CU7nJw/ogGUTd6onAq48R3qEVxoGEtSr4c7O2v08y2VPkW9Ee5v+ih7YUNtNM1KgY0HLKudhFLm8IOYumDtCrebTFhA+12BYVAo2U0cu8RlvsKOzhnHMSH81XLGey/oDql8oMGG9XPGnYpnHMQH+LpA7WjFUrHg8IK9EvNnrIsQKXsr6E3KHQQw/zmtXofzpPI3vSrZYsORb3qY416WMqVslyVtqHgnzWQQWwCdbJdLGtuKNhAwbjrAJxfoQtopSw5ocwGuu51CEL8OctaWXNDQerT4SBmL9Ew6kEd6ARqRFtRMxpBr9Fp60GJDXTDqw5C3D6zDrjLsoG3DaP/RNkA7j0UFfz2RnffV6zZBvqODrpLM0HyMEodpBWtQufQA/TBdcoBvnq19Ae66WWCEJ9CDbLOQK6cxDuZjLDHtwrVYzvKegZdQo+tzmA/wlImu4NztoFGWZbL6kHwkJd2htsKR4IS+9fC/qon0VKFA+CxgW65C9Igflc2DwL22DnYNypcNGhbRt8+74bZkKuV1Q3TrrglmhQuCrTMOohB/p7sbphaxS3Rr3DB0C7nIAYe+6Re4hfZazrspVzysksUAG0Cg7B/j/rRW4UCEN+lUvfX2UIs9dP3ilKxoTzTIDXKLWRvX77fvKwHZ/eBmYTYHoITXjq/gSgLHSQVYkdkcXDuVGoG4jbQV88SbyDskQbxITcgq3k7FA5Coh5NyhdpIGyxBjHIn5Ld/OcVng3JvSj5urIPHYh07EEMPNUqsZoWhTODoQFlHYhwXoMY+CpUZnXhX5w++PZhTB3oDkul5divQYNeJt4gPvh/qDZaHUb7SZs60G80ipI/8tjGHsSgZgzZA+N+DkUCsz1lY+7mNIi/RNWyxoLyIWr7dIwOhZUUXkQD6AXqRWeJB/5tiAP1dWiTjvP875SU/ANPe9xthZlndAAAAABJRU5ErkJggg==" : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAjCAYAAAAe2bNZAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAKwSURBVFhH7ddLyA1hHMfx1zVCQpQFUS4LZEHu1ySFULKgJJfEgiIbeztyS4qFnWKDbFwW2ChRsrGkXJIk9/v9++X9n5533nPmzJn3vLLwq0/eZp6Z83PmeWbOtPxPE9INIzEfi7EKI/DXMh57cAOf8TPjBSahUzMWl/AD2QJZLzEZnZKV+ID0A5/jMvbjauu21CtMQVMzFenl8NtZjh4wa/EN7vuOi61/R6FpaFquIT5osxuSZItsgPHbSgvNQIfTFzFHTrshSa0ikQOIQq8xEx3KGMQJXUGRekUi2ULbMBCl0g9f4MmuowucKwfxAHlFjOMdG4X0Dl7GoWg4ZxEnOoZeiAxp/Tcv1QrpDXaiOwpnFJyEcZJ72I5BKBoLHUJaJtzEcBROujqCl+g2/LZ2YDUWYCJc+ndwH+thLHQY2fPIe9ZC1I3LOVaUBWIOFeVEj+dVXqGPWISaWYq0iJN1MLbgDJ4he9JqZiNioSOoNs67/Fy0ixP1MRxkoVqrxknsh63ARuzGFcQHeLl6Ik1eoUcYgDZZghhw3A0NxJ8Wfqtr0McNVWKho0iLhJNoE5dd7HRiNjt+W+eQlkj5TKzEu2Xs8IdTM1OviE6hEpvFjvNuaFKKFJF36t74Ha+p95HYuRcdTbbIE/gffZhsS01HJROQ3n33oWyqFfHXo+kKH77vEfsVN8xKZsHnSAwoUyivSJpliDFyEbWLhd4iBjVSqGiRyAXEWB8zVeONzUkVA4sUarSIWYcYv9UNtTIH6XXNK1SmiBmNOMZ5lBufHfUKlS1i/EEXx+U+OCPzkBY6gf4ww+ArTOxrpEjkEzy28HG+0qaFvsKHXPqSV6aIeQoXTLwOFYqrzAPjw1N34fUvE1+PvMwNx8uzCy7JW/A38yY4b8rG15pxf/78n38+LS2/AJUMUFYb7b3KAAAAAElFTkSuQmCC");
			utils.toggleMode("fill", true);
			pixelGrid.colorFill = color.toRgbString();
		}
	});
	$("#colorBackgroundPicker").spectrum({
		color: "#ffffff",
		preferredFormat: "rgb",
		showInput: true,
		move: function (color) {
			$(this).css("backgroundColor", color.toRgbString());
			$(this).css("color", utils.getHexContrast(color.toHexString()));
			$(this).text(color.toHexString());
			pixelGrid.gridBackgroundColor = color.toRgbString();
		},
		change: function (color) {
			$(this).css("backgroundColor", color.toRgbString());
			$(this).css("color", utils.getHexContrast(color.toHexString()));
			$(this).text(color.toHexString());
			pixelGrid.gridBackgroundColor = color.toRgbString();
		}
	});
	$("#input_width").val(Math.floor($(window).width() / 20));
	$("#input_height").val(Math.floor($(window).height() / 20) - 1);
	$("#input_width").attr("max", Math.floor($(window).width() / 20));
	$("#input_height").attr("max", Math.floor($(window).height() / 20) - 1);
});

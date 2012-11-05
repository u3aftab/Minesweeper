// Minesweeper Game Engine

var can=document.getElementById("mwframe");
var mw=can.getContext("2d");

// Graphics for the game

var blank=new Image();  //Split all the images into separate files -- drawImage can't clip in Chrome
blank.src="./Resources/blank.png"; 
var boardmine=new Image(); 
boardmine.src="./Resources/boardmine.png";
var clicked=new Image(); 
clicked.src="./Resources/clicked.png";
var explodedmine=new Image(); 
explodedmine.src="./Resources/explodedmine.png";
var flag=new Image(); 
flag.src="./Resources/flag.png";
var mine=new Image(); 
mine.src="./Resources/mine.png";

var site_color="#FFEFD5";

//=== 
var state="foo" //state {menu, pre_start, started, won, lost}
var tile_size=16;

//=== fonts and colors
var menu={
	title:  "40pt playbill",
	options: "30pt playbill",
	select_color: "#FFD700",
	title_color: "#B22222",
	options_color: "#2F4F4F",
}

//=== position of game box insider canvas
var console={
	x: 5,
	y: 30,
	width: 430,
	height: 300,
	bckgrnd_color: "#F0F8FF",
	brdr_color: "#778899",
	brdr_thickness: 4,
}

//=== menu

var brd_slct={
	x: 50,	// position of board size menu
	y: 110, 
	gap: 15, // gap between options
	box_height: 40, // selection box dimensions
	box_length: 110,
	hlght_below: 5,
	slct_gap: 2,
	slct_width: 10,
};

var mines={
	set: 10,
	flag: 10,
	max: 20,
	dim: [8, 8], // row length, column length
	x: 240,
	y: 110,
	height: 200,
	thickness: 6,
	tab_thickness: 25,
	tab_height: 4,
	title_gap: 15,
	write_gap_x: 7,
	write_below:7,
	font: "bold 22pt playbill",
	grad_start: "#FFD700",
	grad_end: "red",
	area: 70,
	font_color: "#2F4F4F",
};

var grad = mw.createLinearGradient(mines.x,mines.y,mines.x, mines.y+mines.height); //mines selection side tab color

var smiley={
	center_x: console.x+console.width-8,
	center_y: console.y+32,
	radius: 60,
	color: "#FFD700",
	outline_color: "black",
	border_thickness: 3,
	smile_rad: 38,
	grin_cir: 1/3, //grin arc 
	grin_thickness: 2.6,
	eyes_x: 18,
	eyes_y: 16,
	eyes_rad: 5,
	frown_y: 155,
	frown_rad: 73,
	frown_cir: 1/7, //frown arc
	frown_eyes_x: 10,
	frown_eyes_rad: 5,
	frown_thickness: 5,
	ay_eyes_cir: .55,
	ay_eyes_rad: 16.5,
	ay_eyes_x: 23,
	ay_eyes_y: 17,
	ay_cir: 1/3,
	ay_rad: 40,
	ay_thickness: 2,
	ay_shds_start_x: 58,
	ay_shds_start_y: 7,
	ay_shds_end_x: 38,
	ay_shds_end_y: 16.3,
	ay_shds_thickness: 3,
	ay_shds_bridge_x: 6,
	ay_shds_bridge_y: 15,
	ay_shds_bridge_thickness: 7,
}

var timer={
	x: console.x+console.width,
	y: console.y+console.height,
	width: 70,
	height: 42,
	brdr: 3,
	color: "black",
	font_color: "red",
	brdr_color: "#F4A460",
	font: "30pt impact",
}

var mine_cnt={
	x: console.x+console.width-190,
	y: console.y+38,
}

var board={
	x: 27,
	y: 27,
	brdr1: 6,
	brdr2: 4,
	brdr1_color: "#778899",
	brdr2_color: "#FAFAD2",
	font: "13pt courier",
	write_offset: 2,
}

//=== game variables
var adj_list=[];
var mines_at=[];
var explored=[];
var flags_at=[];
var down=false //passed by eventlisteners to flag tiles 
var time=0;
var clock;
var total_clicked;

//========Borrowed Functions=======================

function shuffle(array) { //from http://stackoverflow.com/questions/962802/
    var tmp, current, top = array.length;
    if(top) while(--top) {
    	current = Math.floor(Math.random() * (top + 1));
    	tmp = array[current];
    	array[current] = array[top];
    	array[top] = tmp;
    }
    return array;
}

function click(event){	//Function from "http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element"
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;
    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement == currentElement.offsetParent)
    canvasX = event.pageX - totalOffsetX;
    canvasY = event.pageY - totalOffsetY;
    process_click(canvasX, canvasY, down)
}
//========End of Borrowed Functions==================

//========Click Functions

can.addEventListener("click", click, true);
document.addEventListener("keydown", kd, true);
document.addEventListener("keyup", ku, true);
function kd(e) {if (e.keyCode==70) {down=true}};
function ku(e) {if (e.keyCode==70) {down=false}};

//========Game Functions============================= 
function draw_background() {
	mw.fillStyle=site_color; // draws the back-background to blend canvas into site
	mw.fillRect(0, 0, can.width, can.height);
	mw.fillStyle=console.brdr_color;
	mw.fillRect(console.x, console.y, console.width+2*console.brdr_thickness, console.height+2*console.brdr_thickness);
	mw.fillStyle=console.bckgrnd_color;
	mw.fillRect(console.x+console.brdr_thickness, console.y+console.brdr_thickness, console.width, console.height);
};

function contains(arr, val) {
	for (var i=0; i<arr.length; i++) {if (arr[i]==val) {return true}}
	return false
};

function draw_smiley(type) {
	mw.beginPath();
	mw.arc(smiley.center_x, smiley.center_y, smiley.radius, 0, 2 * Math.PI, false);
	mw.fillStyle=smiley.color;
	mw.fill();
	mw.lineWidth=smiley.border_thickness;
	mw.strokeStyle=smiley.outline_color;
	mw.stroke();
	if (type=="happy") {
		mw.beginPath(); //grin
		mw.lineWidth=smiley.grin_thickness;
		mw.arc(smiley.center_x, smiley.center_y, smiley.smile_rad, (1/2-smiley.grin_cir)*Math.PI , (1/2+smiley.grin_cir)*Math.PI, false);
		mw.stroke();
		mw.beginPath(); //right eye
		mw.arc(smiley.center_x-smiley.eyes_x, smiley.center_y-smiley.eyes_y, smiley.eyes_rad, 0 , 2*Math.PI, false);
		mw.fillStyle=smiley.outline_color; //persists for the second eye
		mw.fill();
		mw.beginPath(); //left eye
		mw.arc(smiley.center_x+smiley.eyes_x, smiley.center_y-smiley.eyes_y, smiley.eyes_rad, 0, 2*Math.PI, false);
		mw.fill();
	}
	else if (type=="sad") {
		mw.beginPath(); //grin
		mw.lineWidth=smiley.frown_thickness;
		mw.arc(smiley.center_x, smiley.frown_y, smiley.frown_rad, -(1/2+smiley.frown_cir)*Math.PI , -(1/2-smiley.frown_cir)*Math.PI, false);
		mw.stroke();
		mw.beginPath(); //right eye
		mw.arc(smiley.center_x-smiley.frown_eyes_x, smiley.center_y-smiley.eyes_y, smiley.frown_eyes_rad, 0 , 2*Math.PI, false);
		mw.fillStyle=smiley.outline_color; //persists for the second eye
		mw.fill();
		mw.beginPath(); //left eye
		mw.arc(smiley.center_x+smiley.frown_eyes_x, smiley.center_y-smiley.eyes_y, smiley.frown_eyes_rad, 0, 2*Math.PI, false);
		mw.fill();		
	}
	else if (type=="awwyeah") {
		mw.beginPath(); //grin
		mw.lineWidth=smiley.ay_thickness;
		mw.arc(smiley.center_x, smiley.center_y, smiley.ay_rad, (1/2-smiley.ay_cir)*Math.PI , (1/2+smiley.ay_cir)*Math.PI, false);
		mw.stroke();
		mw.beginPath(); //right shades
		mw.arc(smiley.center_x-smiley.ay_eyes_x, smiley.center_y-smiley.ay_eyes_y, smiley.ay_eyes_rad, (1/2-smiley.ay_eyes_cir)*Math.PI , (1/2+smiley.ay_eyes_cir)*Math.PI, false);
		mw.fillStyle=smiley.outline_color; //persists for the second eye
		mw.fill();
		mw.beginPath(); //left shades
		mw.arc(smiley.center_x+smiley.ay_eyes_x, smiley.center_y-smiley.ay_eyes_y, smiley.ay_eyes_rad, (1/2-smiley.ay_eyes_cir)*Math.PI , (1/2+smiley.ay_eyes_cir)*Math.PI, false);
		mw.fill();		
		mw.beginPath(); //shades frame
		mw.lineWidth=smiley.ay_shds_thickness;
		mw.moveTo(smiley.center_x-smiley.ay_shds_start_x,smiley.center_y-smiley.ay_shds_start_y);
		mw.lineTo(smiley.center_x-smiley.ay_shds_end_x,smiley.center_y-smiley.ay_shds_end_y);
		mw.stroke();
		mw.beginPath(); //shades frame
		mw.moveTo(smiley.center_x+smiley.ay_shds_start_x,smiley.center_y-smiley.ay_shds_start_y);
		mw.lineTo(smiley.center_x+smiley.ay_shds_end_x,smiley.center_y-smiley.ay_shds_end_y);
		mw.stroke();
		mw.beginPath(); //shades frame bridge
		mw.lineWidth=smiley.ay_shds_bridge_thickness;
		mw.moveTo(smiley.center_x-smiley.ay_shds_bridge_x,smiley.center_y-smiley.ay_shds_bridge_y);
		mw.lineTo(smiley.center_x+smiley.ay_shds_bridge_x,smiley.center_y-smiley.ay_shds_bridge_y);
		mw.stroke();
		
	}
}

function menu_textbox(box_x, box_y) {
	mw.fillStyle=console.bckgrnd_color;
	mw.fillRect(brd_slct.x-(brd_slct.slct_gap+brd_slct.slct_width), brd_slct.y+0*brd_slct.box_height+brd_slct.gap*1, brd_slct.slct_width, brd_slct.y+3*brd_slct.box_height+brd_slct.gap*5-brd_slct.y)
	mw.fillStyle=menu.select_color;
	mw.fillRect(box_x, box_y, brd_slct.slct_width, brd_slct.box_height)
}

function load_menu_text() {
	mw.fillStyle=menu.title_color;
	mw.font=menu.title;
	mw.fillText("Board", brd_slct.x, brd_slct.y-mines.title_gap)
	mw.fillText("Mines", mines.x, mines.y-mines.title_gap);
	mw.fillStyle=menu.options_color;
	mw.font=menu.options;
	mw.fillText("8x8", brd_slct.x, brd_slct.y+1*brd_slct.box_height+brd_slct.gap*1);
	mw.fillText("16x16", brd_slct.x, brd_slct.y+2*brd_slct.box_height+brd_slct.gap*3);
	mw.fillText("16x32", brd_slct.x, brd_slct.y+3*brd_slct.box_height+brd_slct.gap*5);
	
};

function gen_adj(x, y) { //generates and returns adjacency matrix given row and column length
	var adj=[];
	for (var i=1; i<x-1; i++) { //non-border tiles
		for (var j=1; j<y-1; j++) {
			adj[i*y+j]=[(i-1)*y+j-1, (i-1)*y+j, (i-1)*y+j+1, i*y+j-1, i*y+j+1, (i+1)*y+j-1, (i+1)*y+j, (i+1)*y+j+1];			
		}
	}
	adj[0]=[1, y, y+1];
	adj[y-1]=[y-2, 2*y-2, 2*y-1]
	adj[(x-1)*y]=[(x-2)*y, (x-2)*y+1, (x-1)*y+1]
	adj[x*y-1]=[x*(y-1)-1, x*(y-1), x*y-2]
	for (var j=1; j<y-1; j++) {
		adj[j]=[j-1, j+1, j+y-1, j+y, j+y+1];
		var plus=(x-1)*y;
		var plus_m1=(x-2)*y;
		adj[j+plus]=[j+plus_m1-1, j+plus_m1, j+plus_m1+1, j+plus-1, j+plus+1];
	};
	for (var i=1; i<x-1; i++) {
		adj[i*y]=[(i-1)*y, (i-1)*y+1, i*y+1, (i+1)*y, (i+1)*y+1];
		adj[(i+1)*y-1]=[(i)*y-2, (i)*y-1, (i+1)*y-2, (i+2)*y-2, (i+2)*y-1];
	};
	return adj
}

function place_mines() {
	var m=[]
	for (var i=0; i<mines.dim[0]*mines.dim[1]; i++) {m[i]=i}
	mines_at=shuffle(m).slice(0, mines.set);
}

function draw_tile(n, type, mines_adj) {
	var x_posn=console.x+board.x+Math.floor(n/mines.dim[1])*tile_size;
	var y_posn=console.y+board.y+(n%mines.dim[1])*tile_size;
	if (type=="blank") {mw.drawImage(blank, x_posn, y_posn)}
	else if (type=="clicked") {mw.drawImage(clicked, x_posn, y_posn)}
	else if (type=="flag") {mw.drawImage(flag, x_posn, y_posn)}
	else if (type=="boardmine") {mw.drawImage(boardmine, x_posn, y_posn)}
	else if (type=="explodedmine") {mw.drawImage(explodedmine, x_posn, y_posn)}
	if (mines_adj>0) {
		mw.fillStyle="black";
		mw.font=board.font;
		mw.fillText(mines_adj, x_posn+board.write_offset, y_posn+tile_size-board.write_offset);
	}
}

function update_mine_cnt() {
	mw.drawImage(mine, mine_cnt.x, mine_cnt.y)
	mw.fillStyle="white";
	if (Math.abs(mines.flag)>99) {
		mw.font="17pt 'wide latin'";
		x=mine_cnt.x+22;
		y=mine_cnt.y+65;
	}
	else if (Math.abs(mines.flag)>9) {
		mw.font="22pt 'wide latin'";
		x=mine_cnt.x+28.5;
		y=mine_cnt.y+65;
	}
	else {
		mw.font="30pt 'wide latin'";
		x=mine_cnt.x+35.2;
		y=mine_cnt.y+68;
	}
	mw.fillText(mines.flag, x, y)
}

function update_time() {
	mw.fillStyle=timer.color
	mw.fillRect(timer.x, timer.y, timer.width, timer.height);
	mw.fillStyle=timer.font_color;
	mw.font=timer.font;
	if (timer.time<10) {var display="00"+timer.time}
	else if (timer.time<100) {var display="0"+timer.time}
	else {var display=timer.time}
	mw.fillText(display, timer.x+3, timer.y+37);
}

function timer_fun() {
	clock=setInterval(function() {
		timer.time=timer.time+1;
		if (timer.time==1000) {clearInterval(clock); return}
		update_time()
	}, 1000);
}

function load_game() {
	adj_list=gen_adj(mines.dim[0], mines.dim[1]);
	place_mines();
	mines.flag=mines.set;
	update_mine_cnt()
	explored=[];
	for (var i=0; i<(mines.dim[0]*mines.dim[1]); i++) {explored[i]=false};
	mw.fillStyle=board.brdr1_color;
	mw.fillRect(console.x+board.x-board.brdr1, console.y+board.y-board.brdr1, 2*board.brdr1+mines.dim[0]*tile_size, 2*board.brdr1+mines.dim[1]*tile_size);
	mw.fillStyle=board.brdr2_color;
	mw.fillRect(console.x+board.x-board.brdr2, console.y+board.y-board.brdr2, 2*board.brdr2+mines.dim[0]*tile_size, 2*board.brdr2+mines.dim[1]*tile_size);
	for (var i=0; i<(mines.dim[0]*mines.dim[1]); i++) {draw_tile(i, "blank")};	
	smiley.center_x=console.x+console.width-8;
	draw_smiley("happy");
	timer.time=0;
	mw.fillStyle=timer.brdr_color;
	mw.fillRect(timer.x-timer.brdr, timer.y-timer.brdr, timer.width+2*timer.brdr, timer.height+2*timer.brdr);
	update_time();
	flags_at=[];
	total_clicked=0;
}

function ngbr_mines(n) {
	var bad_ngbrs=0;
	var ngbr_lst=adj_list[n];
	for (var i=0; i<ngbr_lst.length; i++) {
		if (contains(mines_at, ngbr_lst[i])) {bad_ngbrs++}
	}
	return bad_ngbrs;
}

function reveal_board(n) {
	mines_at.splice((mines_at.indexOf(n)), 1);
	for (var i=0; i<mines_at.length; i++) {
		draw_tile(mines_at[i], "boardmine")
		explored[mines_at[i]]=true
	}
	for (var i=0; i<mines.dim[0]*mines.dim[1]; i++) {
		if (!(explored[i])) {
			draw_tile(i, "clicked");
		}
	}
}

function process_tile(n) {
	if (!(state=="game")) {return} //prevents further execution after game is over
	if (explored[n]) {return}
	if (down) {
		if (contains(flags_at, n)) {
			flags_at.splice((flags_at.indexOf(n)), 1);
			mines.flag++;
			draw_tile(n, "blank");
			update_mine_cnt();
		}
		else {
			draw_tile(n, "flag")
			mines.flag--;
			flags_at.push(n)
			update_mine_cnt();
		}
	}
	else if (contains(flags_at, n)) { //prevents the player from opening tiles where flags have been placed
		return
	}
	else {
		if (contains(mines_at, n)) {
			draw_smiley("sad");
			state="lost";
			draw_tile(n, "explodedmine")
			explored[n]=true;
			clearInterval(clock);
			reveal_board(n);
		}
		else if (ngbr_mines(n)>0) {
			draw_tile(n, "clicked", ngbr_mines(n))
			explored[n]=true;
			total_clicked++;
		}
		else {
			draw_tile(n, "clicked")
			explored[n]=true;
			total_clicked++;
			var ngbr_lst=adj_list[n];
			for (var i=0; i<ngbr_lst.length; i++) {
				if (!(explored[ngbr_lst[i]])) {process_tile(ngbr_lst[i])}
			}
		}
	}
	if (total_clicked==mines.dim[0]*mines.dim[1]-mines.set) {
		clearInterval(clock);
		state="won";
		draw_smiley("awwyeah")
	}
}

function tile(x, y) {
	var bd_x=x-console.x-board.x;
	var bd_y=y-console.y-board.y;
	var n=Math.floor(bd_x/tile_size)*mines.dim[1]+Math.floor(bd_y/tile_size)
	return n;
}

function square(x) {return x*x}

function process_click(x, y, drag){
	if (state=="menu") {
		clearInterval(clock);
		if (x>brd_slct.x-(brd_slct.slct_gap+brd_slct.slct_width) && y>brd_slct.y && x<brd_slct.x+brd_slct.box_length && y<brd_slct.y+3*brd_slct.box_height+brd_slct.gap*5) {
			if (y<brd_slct.y+1*brd_slct.box_height+brd_slct.gap*1) {
				menu_textbox(brd_slct.x-(brd_slct.slct_gap+brd_slct.slct_width), brd_slct.y+0*brd_slct.box_height+brd_slct.gap*1);
				mines.max=20;
				mines.dim=[8, 8];
				console.width=367;
				console.height=300-tile_size*8;
				mine_cnt.x=console.x+console.width-201;
				mine_cnt.y=console.y+38;
				timer.x=console.x+console.width-77;
				timer.y=console.y+console.height-49;
				process_click(mines.x+1, mines.y+mines.height/2, false);
			}
			else if (y<brd_slct.y+2*brd_slct.box_height+brd_slct.gap*3) {
				menu_textbox(brd_slct.x-(brd_slct.slct_gap+brd_slct.slct_width), brd_slct.y+1*brd_slct.box_height+brd_slct.gap*3)
				mines.max=100;
				mines.dim=[16, 16];
				console.width=430;
				console.height=300;
				mine_cnt.x=console.x+console.width-127;
				mine_cnt.y=console.y+95;
				timer.x=console.x+console.width-103;
				timer.y=console.y+console.height-70;
				process_click(mines.x+1, mines.y+mines.height/2, false)
			}
			else if (y<brd_slct.y+3*brd_slct.box_height+brd_slct.gap*5) {
				menu_textbox(brd_slct.x-(brd_slct.slct_gap+brd_slct.slct_width), brd_slct.y+2*brd_slct.box_height+brd_slct.gap*5)
				mines.max=200;
				mines.dim=[32, 16];
				console.width=430+tile_size*16;
				console.height=300;
				mine_cnt.x=console.x+console.width-130;
				mine_cnt.y=console.y+95;
				timer.x=console.x+console.width-104;
				timer.y=console.y+console.height-68;
				process_click(mines.x+1, mines.y+mines.height/2, false)
			}
		}
		else if (x>mines.x && y>mines.y && x<mines.x+mines.tab_thickness && y<mines.y+mines.height) {
			mw.fillStyle=console.bckgrnd_color;
			mw.fillRect(mines.x, mines.y-mines.title_gap, mines.area, mines.height+mines.title_gap+mines.write_below);
			grad.addColorStop(0, mines.grad_start);
			grad.addColorStop(1, mines.grad_end);
			mw.fillStyle=grad;
			mw.fillRect(mines.x, mines.y, mines.thickness, mines.height)
			mines.set=Math.round((y-mines.y)/mines.height*mines.max);
			mw.fillStyle=mines.font_color;
			mw.font=mines.font;
			mw.fillText(mines.set, mines.x+mines.tab_thickness+mines.write_gap_x, y+mines.write_below);	
			mw.fillRect(mines.x, y-mines.tab_height/2, mines.tab_thickness, mines.tab_height);
		}
	
	}
	if (Math.sqrt(square(x-smiley.center_x)+square(y-smiley.center_y))<smiley.radius) {
		if (state=="menu") {
			state="pregame"
			draw_background();
			load_game();
		}
		else {
			state="menu";
			init();
		}
	}
	else if ((state=="game" || state=="pregame") && x>console.x+board.x && y>console.y+board.y && x<console.x+board.x+mines.dim[0]*tile_size&& y<console.y+board.y+mines.dim[1]*tile_size) {
		if (state=="pregame") {
			state="game"
			timer_fun();
		}
		var q=tile(x,y)
		process_tile(q);
	}
}

//========Game Initializer=============================

function init() {
	state="menu"
	console.width=430;
	console.height=300
	smiley.center_x=console.x+console.width-8
	draw_background();
	draw_smiley("happy");
	menu_textbox();
	load_menu_text();
	process_click(brd_slct.x+2, brd_slct.y+1*brd_slct.box_height+brd_slct.gap*1-2, false); //initializes the menus options, setting the starting grid size
}
init();
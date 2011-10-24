// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require jquery
//= require jquery_ujs
//= require_tree .

$(document).ready(function(){

	var Scribnr =  {
		init : function(){
			this.canvas =  $("canvas")[0];
			this.renderer = new Vex.Flow.Renderer(this.canvas, Vex.Flow.Renderer.Backends.CANVAS);
			this.ctx = this.renderer.getContext();
			this.fullMeasures = [];
			this.activeMeasure = null;

			this.createMeasure();
		}, 
		addQuarterNote : function(){ 
			if (this.activeMeasure.isNotFull()) {
				var newNote = new Scribnr.Note({ pitch: ["c/4"], duration: "q" });
				this.activeMeasure.addNote(newNote);
			} else {
				this.fullMeasures.push(this.activeMeasure);
				this.createMeasure(this.getLastMeasure());
				this.addQuarterNote();
			}
			this.redrawAll();
		},
		createMeasure : function(prevMeasure){
			this.activeMeasure = new Scribnr.Measure(this.ctx, prevMeasure);
			if (this.fullMeasures.length < 1) {
				this.activeMeasure.addClef();
			}
		},
		getLastMeasure : function(){
			if (this.fullMeasures.length < 1) {
				throw("ERROR: No previous measures"); }
			else {
				return this.fullMeasures[this.fullMeasures.length - 1];
			}
		},
		redrawAll : function(){
			this.ctx.clear();
			this.activeMeasure.redraw();
			for (i=0; i<this.fullMeasures.length; i++) {
				this.fullMeasures[i].redraw();
			}
		}
	}

	Scribnr.Measure = function(ctx, prevMeasure){
		this.ctx = ctx;
		this.prevMeasure = prevMeasure;
		this.baseNotesLeft = 4;
		this.stave = null;
		this.notes = [];
		this.rests = [];

		this.init = function(){
			this.stave = this.createStave();
			this.stave.setContext(this.ctx).draw();
		}
		this.createStave = function(){
			if (prevMeasure == null) {
				// create the first stave of the line
				return new Vex.Flow.Stave(10, 0, 500);
			}
			else {
				// attach to previous stave
				var prevStave = this.prevMeasure.stave,
					prevX = prevStave.x,
					prevY = prevStave.y,
					prevWidth = prevStave.width;
				return new Vex.Flow.Stave(prevWidth + prevX, prevY, 300);
			}
		}
		this.addNote = function(newNote){
			if (this.isNotFull()) {
				this.notes.push(newNote);
				this.baseNotesLeft -= 1;
				this.fillRests();
			}
			else {
				throw("MEASURE IS FULL: Can't add note to measure");
			}
		}
		this.fillRests = function(){
			// empty rests first
			this.rests = [];
			for (var i = 0; i < this.baseNotesLeft; i++) {
				this.rests.push( new Vex.Flow.StaveNote({ keys: ["b/4"], duration: "qr" }) );
			}
		}
		this.addClef = function(){
			this.stave.addClef("treble");
			this.redraw();
		}
		this.redraw = function(){
			this.stave.setContext(this.ctx).draw();
			// merge rests and notes for formatter
			Vex.Flow.Formatter.FormatAndDraw(this.ctx, this.stave, this.getVexNotesArray().concat(this.rests));
		}

		//
		// Utility functions
		//
		this.isNotFull  = function(){
			if (this.baseNotesLeft > 0) { return true; }
			else { return false; }
		}
		// returns an array of VexNotes of this stave
		this.getVexNotesArray = function(){
			var vexNotesArray = [];
			for (var i = 0, len=this.notes.length; i<len; ++i) {
				vexNotesArray.push(this.notes[i].vexNote);
			}
			return vexNotesArray;
		}
		
		this.init();
	}

	Scribnr.Note = function(noteStructure) {
		this.pitch = noteStructure.pitch;
		this.duration = noteStructure.duration;
		this.vexNote = new Vex.Flow.StaveNote({ keys: this.pitch , duration: this.duration });
	}

	ko.applyBindings(Scribnr);
	Scribnr.init();
});

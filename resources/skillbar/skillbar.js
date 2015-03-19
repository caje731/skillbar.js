(function( $ ){
	$.fn.skillbar = function( options ){
		
		// Defaults for skillbar values
		this.settings = $.extend({
			skills: {},	// {'skill-1': 20, 'skill-2': 15, ...}
		}, options);

		// For each skill, generate a skill-bar
		for (var skill in this.settings.skills){
			activate(this.append(
			'<div class="skillbar-container" style="margin-left:20px;">'+
				'<div class="skillbar-overlay"></div>'+
				'<div class="skillbar-name">'+skill+'</div>'+
				'<div class="skillbar-bar">'+
					'<div class="skillbar-handle draggable ui-widget-content"></div>'+
				'</div>'+
				'<div class="skillbar-percent">'+this.settings.skills[skill]+'%</div>'+
			'</div>'));
		}
	};

	// Private function for attaching event listeners and change handlers
	function activate(obj){
		var container= obj.find(".skillbar-container");
		var overlay = obj.find(".skillbar-overlay");
		var name 	= obj.find(".skillbar-name");
		var bar 	= obj.find(".skillbar-bar");
		var handle 	= obj.find(".skillbar-handle");
		var percent = obj.find(".skillbar-percent");
		
		overlay.click(function(event){
			// Change the width of the bar based on mouse click coordinate
			bar.css('width', event.offsetX + 'px');
		
			// Change the handle position to the mouse click coordinate
			handle.css('left', event.offsetX + 'px');
		
			// Compute the new percentage
			var container_width = Number(container.css('width').replace('px', ''));
			var bar_width 		= Number(bar.css('width').replace('px',''));
			var percentage 		= Math.round(bar_width/container_width*100 + 0.49);
			percent.text( percentage + '%');

			// Finally, change the stored data
			obj.settings.skills[name.text()] = percentage;
		});

		// Set initial properties based on skill percentage
		bar.css('width', percent.text());
		handle.css('left', bar.css('width'));

		handle.draggable({
			axis:'x',
			containment:'.skillbar-container',
			drag: function() {
        		// Change the width of the bar
        		$(this).parent().css('width', $(this).css('left'));

        		// Change the percentage text
        		var container_width = Number($(this).parent().parent().css('width').replace('px', ''));
        		var bar_width 		= Number($(this).css('left').replace('px',''));
        		var percentage 		= Math.round(bar_width/container_width *100 + 0.49);
        		$(this).parent().siblings('.skillbar-percent').text( percentage + '%');

				// Finally, change the stored data
				obj.settings.skills[name.text()] = percentage;
        	}
    	});
	}
})(jQuery);
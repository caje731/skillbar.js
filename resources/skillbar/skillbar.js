(function( $ ){
	$.fn.skillbar = function( options ){
		
		// Defaults for skillbar values
		this.settings = $.extend({
			/* Skills and their percent-weights {'skill-1': 20, 'skill-2': 15, ...} */
			skills: {},

			/* Function for typeahead suggestions */
			substringMatcher : function(strs) {
				return function findMatches(q, cb) {
					var matches, substrRegex;

    				matches = [];
    				substrRegex = new RegExp(q, 'i');

    				// iterate through the pool of strings and for any string that
    				// contains the substring `q`, add it to the `matches` array
    				$.each(strs, function(i, str) {
    					if (substrRegex.test(str)) {
        					// the typeahead jQuery plugin expects suggestions to be a JavaScript object
        					matches.push({ value: str });
    					}
					});

    				cb(matches);
				};
			},
		}, options);

		// Generate the typeahead textbox
		this.append(
			'<div>'+
				'<label for="skills-input">Start Typing A Skill</label>'+
				'<input data-role="tagsinput" name="skills-input" id="skills-input" class="typeahead"></input>'+
			'</div>');

		var skillslist = ['HTML', 'CSS3', 'JavaScript'];

		$('.typeahead').tagsinput({
			typeaheadjs:{
				name		: 'skills',
				displayKey	: 'value',
				valueKey	: 'value',
				source		: this.settings.substringMatcher(skillslist),
				freeInput	: false
			}
		});


		skillbar_obj = this;
		
		// Add initial skills to the tagsinput
		var initial_skills = Object.keys(skillbar_obj.settings.skills);
		for (var i = initial_skills.length - 1; i >= 0; i--) {
			$('.typeahead').tagsinput('add', initial_skills[i]);
		};

		// For each skill, generate a skill-bar
		for (var skill in this.settings.skills){
			add(this, skill, this.settings.skills[skill]);
		}
		
		function updateSkills(){
			typeahead = $(this);
			currentSkills = typeahead.val().split(',');
			
			// Find what skills were added/removed
			
			// 1. Deletion
			var deleted_skills = $(Object.keys(skillbar_obj.settings.skills)).not(currentSkills);
 			for(var i =0; i< deleted_skills.length && deleted_skills[i]!==''; i++){
				remove(skillbar_obj, deleted_skills[i]);
			}

			// 2. Addition
			var added_skills = $(currentSkills).not(Object.keys(skillbar_obj.settings.skills));
			for(var i =0; i< added_skills.length && added_skills[i]!==''; i++){
				add(skillbar_obj, added_skills[i]);
			}
		}

		$('.typeahead').on('change', updateSkills);
	};

	// Private function for adding skills
	function add(skillbar_obj, skill, percent){
		var clean_percentage = 0;
		if(Number(percent) > 0){
			clean_percentage = Math.abs(Number(percent));
		}
		activate(skillbar_obj.append(
			'<div id="'+skill.replace(' ', '_')+'-container" class="skillbar-container" style="margin-left:20px;">'+
				'<div class="skillbar-overlay"></div>'+
				'<div class="skillbar-name">'+skill+'</div>'+
				'<div class="skillbar-bar">'+
					'<div class="skillbar-handle draggable ui-widget-content"></div>'+
				'</div>'+
				'<div class="skillbar-percent">'+clean_percentage+'%</div>'+
			'</div>'), skill);
		skillbar_obj.settings.skills[skill] = clean_percentage;
	}

	// Private function for removing skills
	function remove(skillbar_obj, skill){
		delete skillbar_obj.settings.skills[skill];
		skillbar_obj.find("#"+skill.replace(' ', '_')+"-container").remove();
	}

	// Private function for attaching event listeners and change handlers
	function activate(obj, skill){
		var container= obj.find("#"+skill.replace(' ', '_')+"-container");
		var overlay = container.find(".skillbar-overlay");
		var name 	= container.find(".skillbar-name");
		var bar 	= container.find(".skillbar-bar");
		var handle 	= container.find(".skillbar-handle");
		var percent = container.find(".skillbar-percent");
		
		overlay.click(function(event){
			var allowed_delta = allowed_percent_delta(skillbar_obj);
			var new_width = event.offsetX;
			
			// If click was meant to increase percentage
			if(event.offsetX > Number(bar.css('width').replace('px',''))){
				
				// Do nothing when no delta allowed
				if(allowed_delta<=0){
					return false;
				}
				// Shave off extra width, based on allowed delta
				else{
					var max_width 	= Number(overlay.css('width').replace('px', ''));
					var curr_percent= obj.settings.skills[name.text()];
					var mult_factor = (curr_percent+allowed_delta)/100;
					var intended_pc_increase = (event.offsetX/max_width)*100 - curr_percent;
					if(intended_pc_increase > allowed_delta){
						new_width = max_width*mult_factor;	
					}
				}
			}
			
			// Change the width of the bar based on mouse click coordinate
			bar.css('width', new_width + 'px');
		
			// Change the handle position to the mouse click coordinate
			handle.css('left', new_width + 'px');
		
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
			start: function(event, ui) {
        		start = ui.position.left;
    		},
			drag: function(event, ui) {
				var allowed_delta = allowed_percent_delta(skillbar_obj);
				stop = ui.position.left;
				// Cancel the drag if dragged to right when no delta allowed
				if(allowed_delta<=0 && start<stop){
					return false;
				};

        		// Change the width of the bar
        		$(this).parent().css('width', $(this).css('left'));

        		// Change the percentage text
        		var container_width = Number($(this).parent().parent().css('width').replace('px', ''));
        		var bar_width 		= Number($(this).css('left').replace('px',''));
        		var percentage 		= Math.round(bar_width/container_width *100 + 0.49);
        		$(this).parent().siblings('.skillbar-percent').text( percentage + '%');

				// Finally, change the stored data
				obj.settings.skills[name.text()] = percentage;
        	},
        	stop:function(event, ui){
        		// In case the handle goes beyond allowed limit, bring it back
				handle.css('left', bar.css('width'));
        	}

    	});
	}

	// Private function to calculate allowed percentage delta
	function allowed_percent_delta(skillbar_obj){
		var total = 0;
		for(var skill in skillbar_obj.settings.skills){
			total += skillbar_obj.settings.skills[skill];
		}
		return 100-total;
	}
})(jQuery);
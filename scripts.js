var WG = {
	COLORS: {
		RED: '#E04C4C',
		WHITE: '#EEE',
		PURPLE: '#CA6FE6',
		BLUE: '#52BCE8',
		GOLD: '#EDB34B'
	},
	generateWheel: function(figure, $canvas) {
		// Create wheel
	},
	extractSegment: function($segment) {
		segment = {};

		segment.name = $segment.find('[name="segment_name"]').val();
		segment.type = $segment.find('[name="segment_type"]').val();
		segment.size = $segment.find('[name="segment_size"]').val();

		switch (segment.type) {
			case 'WHITE':
			case 'GOLD':
				segment.damage = $segment.find('[name="segment_damage"]').val();
				segment.modifier = $segment.find('[name="segment_modifier"]').val();

				if (segment.modifier) {
					segment.effect = $segment.find('[name="segment_effect"]').val();
				}
				break;
			case 'PURPLE':
				segment.stars = $segment.find('[name="segment_stars"]').val();
				segment.effect = $segment.find('[name="segment_effect"]').val();
				break;
			case 'BLUE':
				segment.effect = $segment.find('[name="segment_effect"]').val();
				break;
		}

		return segment;
	},
	extractFigure: function($form) {
		var figure = {};

		figure.name     = $form.find('[name="figure_name"]').val();
		figure.types    = [$form.find('[name="figure_type_1"]').val(), $form.find('[name="figure_type_2"]').val()];
		figure.mp       = $form.find('[name="figure_mp"]').val();
		figure.ability  = $form.find('[name="figure_ability_name"]').val();

		if (figure.ablitiy) {
			figure.effect   = $form.find('[name="figure_ability"]').val();
		}

		figure.segments = [];
		$form.find('.segment').each(function(_, segment) {
			figure.segments.push(WG.extractSegment($(segment)));
		});

		return figure;
	},
	formInit: function($form) {
		// Handle dropdown selection menus
		$form.find('.dropdown-item-option').click(function() {
			var $this = $(this);
			var $menu = $this.parent().prev();
			$menu.html($this.data('val') === undefined ? $this.text() : $this.data('val'));
			$menu.val($this.val());
		});

		// Handle segment type change
		$form.find('.segment-type').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $menu = $this.parent().prev();
			var $modifier = $segment.find('[name="segment_modifier"]');
			var $stars = $segment.find('[name="segment_stars"]');
			var $effect = $segment.find('[name="segment_effect"]').parent();
			var $damage = $segment.find('[name="segment_damage"]').parent();
			var $name = $segment.find('[name="segment_name"]');

			var color = $this.val();

			$segment.css('background-color', WG.COLORS[color]);

			switch (color) {
				case 'RED':
					$modifier.hide();
					$stars.hide();
					$effect.slideUp();
					$damage.slideUp();

					$name.val('Miss');
					$name.attr('placeholder', 'Miss');
					break;
				case 'WHITE':
				case 'GOLD':
					$stars.hide();
					$modifier.show();
					$modifier.next().children(':first').click();
					$damage.slideDown();

					$name.attr('placeholder', 'Quick Attack');
					break;
				case 'PURPLE':
					$modifier.hide();
					$stars.show();
					$stars.next().children(':first').click();
					$effect.slideDown();
					$damage.slideUp();

					$name.attr('placeholder', 'Confuse');
					break;
				case 'BLUE':
					$stars.hide();
					$modifier.hide();
					$effect.slideDown();
					$damage.slideUp();

					$name.val('Dodge');
					$name.attr('placeholder', 'Dodge');
					break;
			}
		});

		// Handle segment modifier change
		$form.find('.segment-modifier').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $effect = $segment.find('[name="segment_effect"]').parent();

			if ($this.val()) {
				$effect.slideDown();
			}
			else {
				$effect.slideUp();
			}
		});

		// Handle abliity change
		$form.find('[name="figure_ability_name"]').keyup(function() {
			var $ability = $('[name="figure_ability"]').parent();
			if ($(this).val()) {
				$ability.slideDown();
			}
			else {
				$ability.slideUp();
			}
		});

		// Hide unnecessary content
		$form.find('[name="figure_ability"]').parent().hide();
		$form.find('[name="segment_effect"]').parent().hide();
		$form.find('[name="segment_damage"]').parent().hide();

		// Set default segment type
		$form.find('.segment-type[value="RED"]').click();

		$form
			// Handle segment deletion
			.find('.delete-segment').click(function() {
				$(this).closest('.segment').animate(
					{ opacity: 0, height: 0, padding: 0, margin: 0},
					{ duration: 400, queue: false, complete: function() {
						$(this).remove();
					} });
			})

			// Handle hover effect
			.hover(function() {
				$(this).closest('.segment').css('opacity', '0.7');
			}, function() {
				$(this).closest('.segment').css('opacity', '');
			});
		
		// Activate dragula
		dragula([$form.find('.segments').get(0)]);

		// Create a blank segment template
		var $segmentClone = $form.find('.segment').clone(true);


		// Handle new segment events
		$form.find('.new-segment').click(function() {
			var $newSegment = $segmentClone.clone(true).hide();
			$form.find('.segments').append($newSegment);
			$newSegment.slideDown();
		});
	}
}

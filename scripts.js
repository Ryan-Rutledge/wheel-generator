var WG = {
	WHEEL_SIZE: 96,
	MIN_SIZE: 4,
	COLORS: {
		RED: '#E04C4C',
		WHITE: '#EEE',
		GOLD: '#EDB34B',
		PURPLE: '#CA6FE6',
		BLUE: '#52BCE8'
	},
	DARK_COLORS: {
		RED: '#D42525',
		WHITE: '#D4D4D4',
		GOLD: '#E89F1D',
		PURPLE: '#BA44DE',
		BLUE: '#25ABE2'
	},
	init: function($form, $moveset) {
		var form = new WG.Form($form);
		var moveset = new WG.Moveset($moveset, form);
		form.change();
	},
	Form: function($form) {
		var self = this;
		self.$form = $form;
		self.$segments = $form.find('.segments');
		self.changeListeners = [];

		// Handle dropdown selection menus
		$form.find('.dropdown-item-option').click(function() {
			var $this = $(this);
			var $menu = $this.parent().prev();
			$menu.html($this.data('val') === undefined ? $this.text() : $this.data('val'));
			$menu.val($this.val());
			self.change.call(self);
		});

		// Handle segment type change
		$form.find('.segment-type').click(function() {
			var $this = $(this);
			var $segment = $this.closest('.segment');
			var $menu = $this.parent().prev();
			var $modifier = $segment.find('[name="segment_modifier"]');
			var $stars = $segment.find('[name="segment_stars"]');
			var $effect = $segment.find('[name="segment_effect"]').parent();
			var $damage = $segment.find('[name="segment_damage"]');
			var $name = $segment.find('[name="segment_name"]');

			var color = $this.val();

			$segment.css('background-color', WG.COLORS[color]);

			switch (color) {
				case 'RED':
					$modifier.hide();
					$stars.hide();
					$effect.slideUp();
					$damage.hide();

					$name.val('Miss');
					$name.attr('placeholder', 'Miss');
					break;
				case 'WHITE':
				case 'GOLD':
					$stars.hide();
					$modifier.show();

					if ($effect.is(':hidden')) {
						$modifier.next().children(':first').click();
					}
					else {
						$($modifier.next().children()[1]).click();
					}
					$damage.show();

					$name.attr('placeholder', 'Quick Attack');
					break;
				case 'PURPLE':
					$modifier.hide();
					$stars.show();
					$stars.next().children(':first').click();
					$effect.slideDown();
					$damage.hide();

					$name.attr('placeholder', 'Confuse');
					break;
				case 'BLUE':
					$stars.hide();
					$modifier.hide();
					$effect.slideDown();
					$damage.hide();

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
		$form.find('[name="segment_damage"]').hide();

		// Set default segment type
		$form.find('.segment-type[value="RED"]').click();

		$form
			// Handle segment deletion
			.find('.delete-segment').click(function() {
				$(this).closest('.segment').animate(
					{ opacity: 0, height: 0, padding: 0, margin: 0},
					{ duration: 400, queue: false, complete: function() {
						if ($(this).find('[name="segment_size"]').val()) {
							$form.find('.new-segment').prop('disabled', self.total($form) >= WG.WHEEL_SIZE);
						}

						$(this).remove();

						self.change.call(self);
					} });
			})

			// Handle hover effect
			.hover(function() {
				$(this).closest('.segment').css('opacity', '0.7');
			}, function() {
				$(this).closest('.segment').css('opacity', '');
			});
		
		// Activate dragula
		var drake = dragula([$form.find('.segments').get(0)], {
			direction: 'vertical',
			mirrorContainer: $form.find('.segments').get(0)
		});

		drake.on('dragend', function(el) {
			self.change.call(self);
		});

		// Handle segment size limits
		$form.find('[name="segment_size"]').focus(function() {
			var max = WG.WHEEL_SIZE + parseInt($(this).val()) - self.total($form) ;
			$(this).attr('max', max);
		})
		.change(function() {
			// If total size is exceeded
			var total = self.total($form)
			if (total > WG.WHEEL_SIZE) {
				$(this).val(WG.WHEEL_SIZE + parseInt($(this).val()) - self.total($form));
			}
			if ($(this).val() < WG.MIN_SIZE) {
				$(this).val(WG.MIN_SIZE);
			}

			// Disable/enable new segement button
			total = self.total($form)
			$form.find('.new-segment').prop('disabled', total >= WG.WHEEL_SIZE);
		});

		$form.find('textarea, input, [name]').change(function() {
			self.change.call(self);
		});

		// Create a blank segment template
		var $segmentClone = $form.find('.segment').clone(true);

		// Handle new segment events
		$form.find('.new-segment').click(function() {
			var max = WG.WHEEL_SIZE - self.total($form);

			var $newSegment = $segmentClone.clone(true).hide();
			$form.find('.segments').append($newSegment);
			$newSegment.find('[name="segment_size"]')
				.attr('max', max)
				.val(Math.min(12, max));
			$newSegment.slideDown();
			$form.find('.new-segment').prop('disabled', self.total($form) >= WG.WHEEL_SIZE);
			self.change.call(self);
		});
	},
	Moveset: function($moveset, form) {
		var self = this;
		self.$moveset = $moveset;
		var index;
		var drake = dragula([$moveset.get(0)], {
			moves: function(el, source) {
				return $(el).is('.move');
			},
			accepts: function(el, target, source, sibling) {
				return $(sibling).is('.move');
			},
			direction: 'vertical',
			ignoreInputTextSelection: true,
			mirrorContainer: $moveset.get(0)
		})

		drake.on('drag', function(el) {
			index = $(el).index() - 1;
		});
		
		drake.on('drop', function(el) {
			var new_index = $(el).index() - 1;
			form.move(index, new_index);
			index = undefined;
		});

		form.onChange(function(figure) {
			$moveset.find('tbody').remove();
			$moveset.append(self.generate(figure));
		});
	},
	wheel: {
		generate: function(figure) {
			// Create wheel
		}
	}
};

WG.Form.prototype.total = function() {
	var self = this;
	var total = 0;
	self.$form.find('[name="segment_size"]').each(function() { total += parseInt($(this).val());
	});

	return total;
};

WG.Form.prototype.generateSegment = function($segment) {
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
			segment.damage = $segment.find('[name="segment_stars"]').val();
			segment.effect = $segment.find('[name="segment_effect"]').val();
			break;
		case 'BLUE':
			segment.effect = $segment.find('[name="segment_effect"]').val();
			break;
	}
	
	return segment;
};

WG.Form.prototype.generateFigure = function() {
	var self = this;
	var figure = {};

	figure.name     = self.$form.find('[name="figure_name"]').val();
	figure.types    = [self.$form.find('[name="figure_type_1"]').val(), self.$form.find('[name="figure_type_2"]').val()];
	figure.mp       = self.$form.find('[name="figure_mp"]').val();
	figure.ability  = self.$form.find('[name="figure_ability_name"]').val();

	if (figure.ablitiy) {
		figure.effect   = self.$form.find('[name="figure_ability"]').val();
	}

	figure.segments = [];
	self.$form.find('.segment').each(function(_, segment) {
		figure.segments.push(self.generateSegment($(segment)));
	});

	return figure;
};

WG.Form.prototype.move = function(old_index, new_index) {
	var self = this;
	var $segment = self.$segments.find('.segment').eq(old_index).detach();
	var $next = self.$segments.find('.segment').eq(new_index);
	
	if ($next.get(0)) {
		$next.before($segment);
	}
	else {
		self.$segments.append($segment);
	}
};

WG.Form.prototype.change = function() {
	var self = this;
	self.changeListeners.forEach(function(listener) {
		listener(self.generateFigure());
	});
};

WG.Form.prototype.onChange = function(callback) {
	this.changeListeners.push(callback);
};

WG.Moveset.prototype.TEMPLATE = $(
	'<tbody class="move">' +
		'<tr>' +
			'<td class="move-size-container"><span class="move-size"></span></td>' +
			'<td class="move-name"></td>' +
			'<td class="move-damage"></td>' +
		'</tr>' +
		'<tr>' +
			'<td class="move-effect text-left pl-4 pr-4" colspan="3"></td>' +
		'</tr>' +
		'<tr class="separator">' +
		'</tr>' +
	'</tbody>'
);
WG.Moveset.prototype.generateMove =  function(segment) {
	var $move = WG.Moveset.prototype.TEMPLATE.clone().addClass(segment.type.toLowerCase() + '-move');
	var size = segment.size;
	var name = segment.name;
	var damage = '';
	var effect = '';

	switch (segment.type) {
		case 'WHITE':
		case 'GOLD':
			damage = segment.damage;

			if (segment.modifier) {
				effect = segment.effect;

				if (segment.modifier === '*') {
					name += '*';
					effect = '*' + effect;
				}
				else if (segment.modifier === 'x') {
					damage += 'x';
				}
			}
			break;
		case 'PURPLE':
			for (var i = 0; i < segment.damage; i++) {
				damage += '<i class="fa fa-star"></i>';
			}
			effect = segment.effect;
			break;
		case 'BLUE':
			effect = segment.effect;
			break;
	}

	$move.find('.move-name').text(name);
	$move.find('.move-damage').html(damage);
	$move.find('.move-size').text(size);

	if (effect) {
		$move.find('.move-effect').text(effect);
	}
	else {
		$move.find('.move-effect').parent().remove();
	}

	return $move;
};

WG.Moveset.prototype.generate = function(figure) {
	var self = this;
	var $table = $('<div>');

	// Add segments
	figure.segments.forEach(function(segment) {
		$table.append(self.generateMove(segment));
	});

	return $table.html();
};

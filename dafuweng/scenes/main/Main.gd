extends Control

const BOARD_PATH := "res://data/board_tiles.json"
const CARDS_PATH := "res://data/chance_cards.json"
const CONFIG_PATH := "res://data/config.json"

const MAP_DEFS := [
	{ "name": "地图 1：经典环线", "path": "res://data/board_tiles.json" },
	{ "name": "地图 2：蛇形城区", "path": "res://data/board_tiles_snake.json" },
	{ "name": "地图 3：分叉港湾", "path": "res://data/board_tiles_branch.json" },
	{ "name": "地图 4：庆典城市", "path": "res://data/board_tiles_festival.json" }
]

const PHASE_MENU := "MENU"
const PHASE_WAITING_ROLL := "WAITING_ROLL"
const PHASE_MOVING := "MOVING"
const PHASE_WAITING_DECISION := "WAITING_DECISION"
const PHASE_TURN_END := "TURN_END"
const PHASE_GAME_OVER := "GAME_OVER"

const GROUP_COLORS := {
	"red": "#E84A5F",
	"blue": "#457B9D",
	"green": "#2A9D8F",
	"yellow": "#E9C46A",
	"purple": "#8E6CBB",
	"teal": "#00A8A8",
	"orange": "#F4A261",
	"black": "#2B2D42"
}

const TYPE_INFO := {
	"START": { "label": "起点", "color": "#2A9D8F" },
	"PROPERTY": { "label": "地产", "color": "#F6C85F" },
	"CHANCE": { "label": "机会", "color": "#7B68EE" },
	"TAX": { "label": "税收", "color": "#E76F51" },
	"BONUS": { "label": "奖励", "color": "#52B788" },
	"PENALTY": { "label": "惩罚", "color": "#C1121F" },
	"EMPTY": { "label": "休息", "color": "#8D99AE" },
	"LOTTERY": { "label": "抽奖", "color": "#FFB703" },
	"MARKET": { "label": "市集", "color": "#06D6A0" },
	"TRANSIT": { "label": "换乘", "color": "#118AB2" }
}

var rng := RandomNumberGenerator.new()
var config: Dictionary = {}
var board_tiles: Array = []
var chance_cards: Array = []
var tile_by_id: Dictionary = {}
var tile_buttons: Dictionary = {}
var piece_nodes: Dictionary = {}
var piece_tweens: Dictionary = {}
var property_owners: Dictionary = {}
var property_levels: Dictionary = {}
var players: Array = []
var player_rows: Dictionary = {}
var log_entries: Array[String] = []
var log_labels: Array[Label] = []

var current_player_index := 0
var round_number := 1
var phase := PHASE_MENU
var last_roll := 0
var pending_purchase_tile = null
var pending_upgrade_tile = null
var max_rounds := 30
var start_bonus := 200
var ai_waiting := false

var root_stack: Control
var menu_layer: Control
var game_layer: Control
var board_surface: Control
var pieces_layer: Control
var player_list: VBoxContainer
var log_list: VBoxContainer
var title_label: Label
var subtitle_label: Label
var turn_label: Label
var phase_label: Label
var dice_label: Label
var roll_button: Button
var buy_button: Button
var upgrade_button: Button
var skip_button: Button
var end_button: Button
var restart_button: Button
var player_count_option: OptionButton
var mode_option: OptionButton
var map_option: OptionButton
var ai_checkboxes: Array[CheckBox] = []
var name_inputs: Array[LineEdit] = []
var info_panel: PanelContainer
var info_title: Label
var info_body: Label
var overlay: Control
var overlay_title: Label
var overlay_body: RichTextLabel
var overlay_primary: Button
var overlay_secondary: Button
var branch_overlay: Control
var branch_title: Label
var branch_body: Label
var branch_a_button: Button
var branch_b_button: Button

signal branch_choice_selected(tile_id: int)


func _ready() -> void:
	rng.randomize()
	_load_data()
	_build_ui()
	_show_menu()


func _load_data() -> void:
	config = _read_json(CONFIG_PATH, {})
	_load_board(BOARD_PATH)
	chance_cards = _read_json(CARDS_PATH, [])
	start_bonus = int(config.get("start_bonus", 200))
	max_rounds = int(config.get("max_rounds", 30))


func _load_board(path: String) -> void:
	board_tiles = _read_json(path, [])
	tile_by_id.clear()
	for tile in board_tiles:
		tile_by_id[int(tile["id"])] = tile


func _read_json(path: String, fallback):
	if not FileAccess.file_exists(path):
		push_warning("Missing data file: " + path)
		return fallback
	var file := FileAccess.open(path, FileAccess.READ)
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed == null:
		push_warning("Invalid JSON: " + path)
		return fallback
	return parsed


func _build_ui() -> void:
	root_stack = Control.new()
	root_stack.set_anchors_preset(Control.PRESET_FULL_RECT)
	add_child(root_stack)

	var bg := ColorRect.new()
	bg.color = Color("#10151F")
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_stack.add_child(bg)

	var vignette := ColorRect.new()
	vignette.color = Color("#172033")
	vignette.anchor_left = 0.0
	vignette.anchor_top = 0.0
	vignette.anchor_right = 1.0
	vignette.anchor_bottom = 0.35
	root_stack.add_child(vignette)

	game_layer = Control.new()
	game_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_stack.add_child(game_layer)
	_build_game_layer()

	menu_layer = Control.new()
	menu_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	root_stack.add_child(menu_layer)
	_build_menu_layer()

	_build_overlay()
	_build_branch_overlay()


func _build_menu_layer() -> void:
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	menu_layer.add_child(center)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(580, 690)
	card.add_theme_stylebox_override("panel", _panel_style("#F8FAFC", "#D7DEE8", 10))
	center.add_child(card)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 18)
	card.add_child(box)

	var title := Label.new()
	title.text = "桌面大富翁"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 44)
	title.add_theme_color_override("font_color", Color("#162033"))
	box.add_child(title)

	var intro := Label.new()
	intro.text = "本地多人回合制原型"
	intro.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	intro.add_theme_font_size_override("font_size", 16)
	intro.add_theme_color_override("font_color", Color("#607087"))
	box.add_child(intro)

	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 12)
	box.add_child(form)

	map_option = _make_option_button()
	for i in range(MAP_DEFS.size()):
		map_option.add_item(String(MAP_DEFS[i]["name"]), i)
	map_option.selected = 0
	form.add_child(_field_row("地图", map_option))

	player_count_option = _make_option_button()
	player_count_option.add_item("2 名玩家", 2)
	player_count_option.add_item("3 名玩家", 3)
	player_count_option.add_item("4 名玩家", 4)
	player_count_option.selected = 0
	player_count_option.item_selected.connect(_on_menu_player_count_changed)
	form.add_child(_field_row("玩家数量", player_count_option))

	mode_option = _make_option_button()
	mode_option.add_item("30 回合资产制", 0)
	mode_option.add_item("破产淘汰制", 1)
	mode_option.selected = 0
	form.add_child(_field_row("胜利模式", mode_option))

	var player_config_box := VBoxContainer.new()
	player_config_box.add_theme_constant_override("separation", 8)
	form.add_child(player_config_box)

	for i in range(4):
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var input := LineEdit.new()
		input.text = config.get("default_players", [])[i].get("name", "玩家") if i < config.get("default_players", []).size() else "玩家"
		input.custom_minimum_size = Vector2(260, 42)
		input.add_theme_stylebox_override("normal", _panel_style("#FFFFFF", "#D7DEE8", 8))
		input.add_theme_stylebox_override("focus", _panel_style("#FFFFFF", "#457B9D", 8))
		input.add_theme_color_override("font_color", Color("#162033"))
		input.add_theme_color_override("font_focus_color", Color("#162033"))
		input.add_theme_color_override("caret_color", Color("#162033"))
		input.add_theme_color_override("placeholder_color", Color("#607087"))
		row.add_child(input)
		name_inputs.append(input)

		var check := CheckBox.new()
		check.text = "AI"
		check.button_pressed = bool(config.get("default_players", [])[i].get("is_ai", false)) if i < config.get("default_players", []).size() else false
		check.add_theme_color_override("font_color", Color("#162033"))
		check.add_theme_color_override("font_hover_color", Color("#162033"))
		check.add_theme_color_override("font_pressed_color", Color("#162033"))
		check.add_theme_color_override("font_focus_color", Color("#162033"))
		check.add_theme_color_override("font_disabled_color", Color("#64748B"))
		row.add_child(check)
		ai_checkboxes.append(check)
		player_config_box.add_child(_field_row("玩家 %d" % [i + 1], row))

	var start_button := Button.new()
	start_button.text = "开始游戏"
	start_button.custom_minimum_size = Vector2(0, 52)
	_style_button(start_button, "#2A9D8F", "#31B49F", "#237F75", "#FFFFFF")
	start_button.pressed.connect(_on_start_game_pressed)
	box.add_child(start_button)

	var note := Label.new()
	note.text = "提示：可在菜单中把后两名设为 AI，快速测试完整对局。"
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	note.add_theme_font_size_override("font_size", 13)
	note.add_theme_color_override("font_color", Color("#78879A"))
	box.add_child(note)

	_on_menu_player_count_changed(0)


func _build_game_layer() -> void:
	var margin := MarginContainer.new()
	margin.set_anchors_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 28)
	margin.add_theme_constant_override("margin_top", 22)
	margin.add_theme_constant_override("margin_right", 28)
	margin.add_theme_constant_override("margin_bottom", 22)
	game_layer.add_child(margin)

	var layout := HBoxContainer.new()
	layout.add_theme_constant_override("separation", 24)
	margin.add_child(layout)

	var left_col := VBoxContainer.new()
	left_col.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_col.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	left_col.custom_minimum_size = Vector2(820, 838)
	left_col.add_theme_constant_override("separation", 16)
	layout.add_child(left_col)

	var top_bar := HBoxContainer.new()
	top_bar.add_theme_constant_override("separation", 12)
	top_bar.custom_minimum_size = Vector2(0, 62)
	left_col.add_child(top_bar)

	var title_box := VBoxContainer.new()
	title_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top_bar.add_child(title_box)

	title_label = Label.new()
	title_label.text = "桌面大富翁"
	title_label.add_theme_font_size_override("font_size", 34)
	title_label.add_theme_color_override("font_color", Color("#F8FAFC"))
	title_box.add_child(title_label)

	subtitle_label = Label.new()
	subtitle_label.text = "准备开始"
	subtitle_label.add_theme_font_size_override("font_size", 15)
	subtitle_label.add_theme_color_override("font_color", Color("#AEBBD0"))
	title_box.add_child(subtitle_label)

	var controls := HBoxContainer.new()
	controls.add_theme_constant_override("separation", 10)
	top_bar.add_child(controls)

	roll_button = _make_action_button("掷骰")
	roll_button.pressed.connect(_on_roll_pressed)
	controls.add_child(roll_button)

	end_button = _make_action_button("结束回合")
	end_button.pressed.connect(_on_end_pressed)
	controls.add_child(end_button)

	restart_button = _make_action_button("主菜单")
	restart_button.pressed.connect(_show_menu)
	controls.add_child(restart_button)

	var board_shell := PanelContainer.new()
	board_shell.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	board_shell.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	board_shell.custom_minimum_size = Vector2(0, 776)
	board_shell.add_theme_stylebox_override("panel", _panel_style("#EEF3F8", "#CCD6E2", 10))
	left_col.add_child(board_shell)

	var board_center := CenterContainer.new()
	board_shell.add_child(board_center)

	board_surface = Control.new()
	board_surface.custom_minimum_size = Vector2(760, 760)
	board_center.add_child(board_surface)

	_build_board()

	var right_col := VBoxContainer.new()
	right_col.custom_minimum_size = Vector2(360, 740)
	right_col.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	right_col.clip_contents = true
	right_col.add_theme_constant_override("separation", 10)
	layout.add_child(right_col)

	var status_card := PanelContainer.new()
	status_card.custom_minimum_size = Vector2(0, 170)
	status_card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	status_card.add_theme_stylebox_override("panel", _panel_style("#F8FAFC", "#D7DEE8", 8))
	right_col.add_child(status_card)

	var status_box := VBoxContainer.new()
	status_box.add_theme_constant_override("separation", 6)
	status_card.add_child(status_box)

	turn_label = _side_label("第 1 回合")
	status_box.add_child(turn_label)
	phase_label = _side_label("等待掷骰")
	status_box.add_child(phase_label)
	dice_label = Label.new()
	dice_label.text = "-"
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_label.add_theme_font_size_override("font_size", 42)
	dice_label.add_theme_color_override("font_color", Color("#162033"))
	status_box.add_child(dice_label)

	var decision_row := HBoxContainer.new()
	decision_row.add_theme_constant_override("separation", 8)
	buy_button = _make_action_button("购买")
	buy_button.custom_minimum_size = Vector2(90, 38)
	buy_button.pressed.connect(_on_buy_pressed)
	decision_row.add_child(buy_button)
	upgrade_button = _make_action_button("升级")
	upgrade_button.custom_minimum_size = Vector2(90, 38)
	upgrade_button.pressed.connect(_on_upgrade_pressed)
	decision_row.add_child(upgrade_button)
	skip_button = _make_action_button("跳过")
	skip_button.custom_minimum_size = Vector2(90, 38)
	skip_button.pressed.connect(_on_skip_pressed)
	decision_row.add_child(skip_button)
	status_box.add_child(decision_row)

	info_panel = PanelContainer.new()
	info_panel.custom_minimum_size = Vector2(0, 118)
	info_panel.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	info_panel.clip_contents = true
	info_panel.add_theme_stylebox_override("panel", _panel_style("#FFFFFF", "#D7DEE8", 8))
	right_col.add_child(info_panel)

	var info_box := VBoxContainer.new()
	info_box.add_theme_constant_override("separation", 6)
	info_box.clip_contents = true
	info_panel.add_child(info_box)
	info_title = _section_title("地块信息")
	info_box.add_child(info_title)
	info_body = Label.new()
	info_body.text = "悬停棋盘格查看详情。"
	info_body.custom_minimum_size = Vector2(0, 52)
	info_body.clip_text = true
	info_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info_body.add_theme_font_size_override("font_size", 14)
	info_body.add_theme_color_override("font_color", Color("#4D5D72"))
	info_box.add_child(info_body)

	var players_card := PanelContainer.new()
	players_card.custom_minimum_size = Vector2(0, 220)
	players_card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	players_card.clip_contents = true
	players_card.add_theme_stylebox_override("panel", _panel_style("#F8FAFC", "#D7DEE8", 8))
	right_col.add_child(players_card)

	var players_box := VBoxContainer.new()
	players_box.add_theme_constant_override("separation", 6)
	players_box.clip_contents = true
	players_card.add_child(players_box)
	players_box.add_child(_section_title("玩家资产"))
	player_list = VBoxContainer.new()
	player_list.clip_contents = true
	player_list.add_theme_constant_override("separation", 4)
	players_box.add_child(player_list)

	var log_card := PanelContainer.new()
	log_card.custom_minimum_size = Vector2(0, 150)
	log_card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	log_card.clip_contents = true
	log_card.add_theme_stylebox_override("panel", _panel_style("#111827", "#263247", 8))
	right_col.add_child(log_card)

	var log_box := VBoxContainer.new()
	log_box.add_theme_constant_override("separation", 5)
	log_box.clip_contents = true
	log_card.add_child(log_box)
	var log_title := _section_title("事件记录")
	log_title.add_theme_color_override("font_color", Color("#F8FAFC"))
	log_box.add_child(log_title)
	log_list = VBoxContainer.new()
	log_list.clip_contents = true
	log_list.add_theme_constant_override("separation", 2)
	log_box.add_child(log_list)
	_build_log_rows()


func _build_board() -> void:
	tile_buttons.clear()
	_clear_children(board_surface)

	var max_x := 0
	var max_y := 0
	for tile in board_tiles:
		var tile_pos: Array = tile["position"] as Array
		max_x = max(max_x, int(tile_pos[0]))
		max_y = max(max_y, int(tile_pos[1]))

	var grid_columns: int = max_x + 1
	var grid_rows: int = max_y + 1
	var stride: float = min(760.0 / float(grid_columns), 760.0 / float(grid_rows))
	var tile_size: float = clamp(stride - 6.0, 42.0, 88.0)
	var offset: Vector2 = Vector2((760.0 - stride * float(grid_columns)) * 0.5 + 3.0, (760.0 - stride * float(grid_rows)) * 0.5 + 3.0)

	for tile in board_tiles:
		var button := Button.new()
		var pos: Array = tile["position"] as Array
		button.position = offset + Vector2(float(pos[0]) * stride, float(pos[1]) * stride)
		button.custom_minimum_size = Vector2(tile_size, tile_size)
		button.size = Vector2(tile_size, tile_size)
		button.text = "%d\n%s" % [int(tile["id"]), String(tile["name"])]
		button.tooltip_text = _tile_description(tile)
		button.clip_text = true
		button.focus_mode = Control.FOCUS_NONE
		button.add_theme_font_size_override("font_size", 12 if tile_size < 70.0 else 13)
		button.add_theme_color_override("font_color", Color("#182132"))
		_style_tile(button, tile)
		button.mouse_entered.connect(_on_tile_hovered.bind(tile))
		board_surface.add_child(button)
		tile_buttons[int(tile["id"])] = button

	if _should_show_center_panel(max_x, max_y):
		var center := PanelContainer.new()
		center.position = offset + Vector2(stride, stride)
		center.size = Vector2(stride * float(max_x - 1) - 6.0, stride * float(max_y - 1) - 6.0)
		center.add_theme_stylebox_override("panel", _panel_style("#FFFFFF", "#D7DEE8", 10))
		board_surface.add_child(center)

		var center_box := VBoxContainer.new()
		center_box.alignment = BoxContainer.ALIGNMENT_CENTER
		center_box.add_theme_constant_override("separation", 12)
		center.add_child(center_box)

		var brand := Label.new()
		brand.text = "DAFUWENG"
		brand.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		brand.add_theme_font_size_override("font_size", 48)
		brand.add_theme_color_override("font_color", Color("#162033"))
		center_box.add_child(brand)

		var hint := Label.new()
		hint.text = "掷骰、购置、收租，成为最后的城市赢家"
		hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		hint.add_theme_font_size_override("font_size", 16)
		hint.add_theme_color_override("font_color", Color("#607087"))
		center_box.add_child(hint)

		center_box.add_child(_mini_legend())
		center.move_to_front()

	pieces_layer = Control.new()
	pieces_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	pieces_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	board_surface.add_child(pieces_layer)
	pieces_layer.move_to_front()


func _mini_legend() -> Control:
	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", 12)
	grid.add_theme_constant_override("v_separation", 8)
	for tile_type in ["PROPERTY", "CHANCE", "TAX", "BONUS", "PENALTY", "START", "LOTTERY", "MARKET", "TRANSIT"]:
		var item := HBoxContainer.new()
		item.add_theme_constant_override("separation", 6)
		var swatch := ColorRect.new()
		swatch.custom_minimum_size = Vector2(16, 16)
		swatch.color = Color(TYPE_INFO[tile_type]["color"])
		item.add_child(swatch)
		var label := Label.new()
		label.text = TYPE_INFO[tile_type]["label"]
		label.add_theme_font_size_override("font_size", 13)
		label.add_theme_color_override("font_color", Color("#4D5D72"))
		item.add_child(label)
		grid.add_child(item)
	return grid


func _should_show_center_panel(max_x: int, max_y: int) -> bool:
	if max_x < 4 or max_y < 4:
		return false
	for tile in board_tiles:
		var pos: Array = tile["position"] as Array
		if int(pos[0]) > 0 and int(pos[0]) < max_x and int(pos[1]) > 0 and int(pos[1]) < max_y:
			return false
	return true


func _build_overlay() -> void:
	overlay = Control.new()
	overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.visible = false
	root_stack.add_child(overlay)

	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.55)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.add_child(dim)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	overlay.add_child(center)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(520, 320)
	card.add_theme_stylebox_override("panel", _panel_style("#F8FAFC", "#D7DEE8", 10))
	center.add_child(card)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 14)
	card.add_child(box)

	overlay_title = Label.new()
	overlay_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	overlay_title.add_theme_font_size_override("font_size", 30)
	overlay_title.add_theme_color_override("font_color", Color("#162033"))
	box.add_child(overlay_title)

	overlay_body = RichTextLabel.new()
	overlay_body.fit_content = true
	overlay_body.bbcode_enabled = true
	overlay_body.scroll_active = false
	overlay_body.custom_minimum_size = Vector2(460, 120)
	overlay_body.add_theme_font_size_override("normal_font_size", 16)
	overlay_body.add_theme_color_override("default_color", Color("#4D5D72"))
	box.add_child(overlay_body)

	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 12)
	overlay_primary = _make_action_button("确定")
	overlay_primary.pressed.connect(_hide_overlay)
	row.add_child(overlay_primary)
	overlay_secondary = _make_action_button("返回主菜单")
	overlay_secondary.pressed.connect(_show_menu)
	row.add_child(overlay_secondary)
	box.add_child(row)


func _build_branch_overlay() -> void:
	branch_overlay = Control.new()
	branch_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	branch_overlay.visible = false
	root_stack.add_child(branch_overlay)

	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.45)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	branch_overlay.add_child(dim)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	branch_overlay.add_child(center)

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(480, 250)
	card.add_theme_stylebox_override("panel", _panel_style("#F8FAFC", "#D7DEE8", 10))
	center.add_child(card)

	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 14)
	card.add_child(box)

	branch_title = Label.new()
	branch_title.text = "选择路线"
	branch_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	branch_title.add_theme_font_size_override("font_size", 28)
	branch_title.add_theme_color_override("font_color", Color("#162033"))
	box.add_child(branch_title)

	branch_body = Label.new()
	branch_body.text = "这里有一处分叉。"
	branch_body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	branch_body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	branch_body.add_theme_font_size_override("font_size", 15)
	branch_body.add_theme_color_override("font_color", Color("#4D5D72"))
	box.add_child(branch_body)

	var row := HBoxContainer.new()
	row.alignment = BoxContainer.ALIGNMENT_CENTER
	row.add_theme_constant_override("separation", 12)
	branch_a_button = _make_action_button("路线 A")
	branch_b_button = _make_action_button("路线 B")
	branch_a_button.pressed.connect(_on_branch_choice_button_pressed.bind(branch_a_button))
	branch_b_button.pressed.connect(_on_branch_choice_button_pressed.bind(branch_b_button))
	row.add_child(branch_a_button)
	row.add_child(branch_b_button)
	box.add_child(row)


func _show_menu() -> void:
	phase = PHASE_MENU
	_clear_piece_tweens()
	menu_layer.visible = true
	game_layer.visible = false
	overlay.visible = false
	if branch_overlay != null:
		branch_overlay.visible = false


func _on_start_game_pressed() -> void:
	var count := player_count_option.get_selected_id()
	_start_game(count)


func _start_game(count: int) -> void:
	var selected_map: Dictionary = MAP_DEFS[map_option.get_selected_id()] as Dictionary
	property_owners.clear()
	property_levels.clear()
	_clear_piece_tweens()
	piece_nodes.clear()
	player_rows.clear()
	_load_board(String(selected_map["path"]))
	_build_board()

	menu_layer.visible = false
	game_layer.visible = true
	overlay.visible = false
	branch_overlay.visible = false
	phase = PHASE_WAITING_ROLL
	current_player_index = 0
	round_number = 1
	last_roll = 0
	pending_purchase_tile = null
	pending_upgrade_tile = null
	ai_waiting = false
	_clear_children(player_list)
	_clear_logs()

	players.clear()
	var defaults: Array = config.get("default_players", []) as Array
	for i in range(count):
		var default_player: Dictionary = {}
		if i < defaults.size():
			default_player = defaults[i] as Dictionary
		var player := {
			"id": i,
			"name": name_inputs[i].text.strip_edges() if name_inputs[i].text.strip_edges() != "" else default_player.get("name", "玩家 %d" % [i + 1]),
			"color": default_player.get("color", "#FFFFFF"),
			"money": int(config.get("starting_money", 1800)),
			"position": 0,
			"properties": [],
			"status": "active",
			"is_ai": ai_checkboxes[i].button_pressed
		}
		players.append(player)
		_create_piece(player)

	for id in tile_buttons.keys():
		_style_tile(tile_buttons[id] as Button, tile_by_id[id] as Dictionary)

	_log("%s 开始，%d 名玩家入场。" % [selected_map["name"], count])
	_refresh_all()
	_start_turn()


func _start_turn() -> void:
	if phase == PHASE_GAME_OVER:
		return
	var active := _active_players()
	if active.size() <= 1:
		_finish_game("最后玩家胜利")
		return
	var current := _current_player()
	if current["status"] != "active":
		_advance_to_next_player()
		return
	phase = PHASE_WAITING_ROLL
	pending_purchase_tile = null
	pending_upgrade_tile = null
	last_roll = 0
	dice_label.text = "-"
	_log("轮到 %s。" % [current["name"]])
	_refresh_all()
	if bool(current["is_ai"]):
		_schedule_ai_turn()


func _schedule_ai_turn() -> void:
	if ai_waiting:
		return
	ai_waiting = true
	await get_tree().create_timer(0.8).timeout
	ai_waiting = false
	if phase == PHASE_WAITING_ROLL and bool(_current_player()["is_ai"]):
		_on_roll_pressed()


func _on_roll_pressed() -> void:
	if phase != PHASE_WAITING_ROLL:
		return
	phase = PHASE_MOVING
	last_roll = rng.randi_range(1, 6)
	_log("%s 拿起骰子。" % [_current_player()["name"]])
	_refresh_all()
	await _animate_dice_roll(last_roll)
	_log("%s 掷出 %d 点。" % [_current_player()["name"], last_roll])
	await _move_current_player(last_roll)
	await _resolve_current_tile()


func _animate_dice_roll(final_roll: int) -> void:
	var flashes := 12
	for i in range(flashes):
		dice_label.text = str(rng.randi_range(1, 6))
		dice_label.scale = Vector2(1.08, 1.08) if i % 2 == 0 else Vector2.ONE
		await get_tree().create_timer(0.055 + float(i) * 0.006).timeout
	dice_label.text = str(final_roll)
	dice_label.scale = Vector2(1.18, 1.18)
	var tween := create_tween()
	tween.tween_property(dice_label, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await tween.finished


func _move_current_player(steps: int) -> void:
	var player := _current_player()
	var start_pos := int(player["position"])
	for step in range(steps):
		var next_pos := await _get_next_tile_id(player)
		if next_pos == 0 and int(player["position"]) != 0:
			_add_money(player, start_bonus)
			_log("%s 经过起点，获得 %d 元。" % [player["name"], start_bonus])
		player["position"] = next_pos
		_update_piece_position(player, true)
		await get_tree().create_timer(0.12).timeout
	if start_pos == int(player["position"]):
		_update_piece_position(player, false)


func _get_next_tile_id(player: Dictionary) -> int:
	var current_tile: Dictionary = tile_by_id[int(player["position"])] as Dictionary
	if current_tile.has("next_ids"):
		var next_ids: Array = current_tile["next_ids"] as Array
		if next_ids.size() > 1:
			if bool(player["is_ai"]):
				return int(next_ids[rng.randi_range(0, next_ids.size() - 1)])
			return await _choose_branch(current_tile, next_ids)
		if next_ids.size() == 1:
			return int(next_ids[0])
	if current_tile.has("next_id"):
		return int(current_tile["next_id"])
	return (int(player["position"]) + 1) % board_tiles.size()


func _choose_branch(tile: Dictionary, next_ids: Array) -> int:
	var first_id := int(next_ids[0])
	var second_id := int(next_ids[1])
	var first_tile: Dictionary = tile_by_id[first_id] as Dictionary
	var second_tile: Dictionary = tile_by_id[second_id] as Dictionary
	branch_title.text = "选择路线"
	branch_body.text = "%s 有两条路可以走。" % [tile["name"]]
	branch_a_button.text = "前往 %s" % [first_tile["name"]]
	branch_b_button.text = "前往 %s" % [second_tile["name"]]
	branch_a_button.set_meta("target_id", first_id)
	branch_b_button.set_meta("target_id", second_id)
	branch_overlay.visible = true
	var chosen_value: Variant = await branch_choice_selected
	var chosen_id: int = int(chosen_value)
	branch_overlay.visible = false
	return chosen_id


func _on_branch_choice_button_pressed(button: Button) -> void:
	branch_choice_selected.emit(int(button.get_meta("target_id")))


func _resolve_current_tile() -> void:
	if phase == PHASE_GAME_OVER:
		return
	var player := _current_player()
	var tile: Dictionary = tile_by_id[int(player["position"])] as Dictionary
	phase_label.text = "结算：" + String(tile["name"])
	_on_tile_hovered(tile)
	match String(tile["type"]):
		"START":
			_log("%s 停在起点。" % [player["name"]])
			_end_or_wait()
		"PROPERTY":
			_resolve_property(player, tile)
		"TAX":
			var amount := int(tile.get("amount", 0))
			_remove_money(player, amount)
			_log("%s 缴纳税费 %d 元。" % [player["name"], amount])
			_after_money_changed()
			_end_or_wait()
		"BONUS":
			var amount := int(tile.get("amount", 0))
			_add_money(player, amount)
			_log("%s 获得奖励 %d 元。" % [player["name"], amount])
			_after_money_changed()
			_end_or_wait()
		"PENALTY":
			var amount := int(tile.get("amount", 0))
			_remove_money(player, amount)
			_log("%s 支付罚款 %d 元。" % [player["name"], amount])
			_after_money_changed()
			_end_or_wait()
		"CHANCE":
			await _draw_and_apply_card(player)
			_end_or_wait()
		"LOTTERY":
			var min_amount := int(tile.get("min_amount", -180))
			var max_amount := int(tile.get("max_amount", 260))
			var amount := rng.randi_range(min_amount, max_amount)
			if amount >= 0:
				_add_money(player, amount)
				_log("%s 抽奖赢得 %d 元。" % [player["name"], amount])
			else:
				_remove_money(player, abs(amount))
				_log("%s 抽奖失手，支付 %d 元。" % [player["name"], abs(amount)])
			_after_money_changed()
			_end_or_wait()
		"MARKET":
			var market_amount := int(tile.get("amount", 80))
			var income: int = max(1, player["properties"].size()) * market_amount
			_add_money(player, income)
			_log("%s 在市集获得经营收入 %d 元。" % [player["name"], income])
			_after_money_changed()
			_end_or_wait()
		"TRANSIT":
			var target := int(tile.get("target_tile", rng.randi_range(0, board_tiles.size() - 1)))
			player["position"] = target
			_update_piece_position(player, true)
			_log("%s 乘坐换乘线到达 %s。" % [player["name"], tile_by_id[target]["name"]])
			await get_tree().create_timer(0.18).timeout
			_end_or_wait()
		_:
			_log("%s 在这里休息了一下。" % [player["name"]])
			_end_or_wait()


func _resolve_property(player: Dictionary, tile: Dictionary) -> void:
	var tile_id := int(tile["id"])
	if not property_owners.has(tile_id):
		if int(player["money"]) >= int(tile["price"]):
			pending_purchase_tile = tile
			phase = PHASE_WAITING_DECISION
			_log("%s 可以购买 %s，价格 %d 元。" % [player["name"], tile["name"], int(tile["price"])])
			if bool(player["is_ai"]):
				await get_tree().create_timer(0.7).timeout
				if int(player["money"]) >= int(tile["price"]) + 300:
					_on_buy_pressed()
				else:
					_on_skip_pressed()
			else:
				_refresh_all()
		else:
			_log("%s 资金不足，无法购买 %s。" % [player["name"], tile["name"]])
			_end_or_wait()
		return

	var owner_id := int(property_owners[tile_id])
	if owner_id == int(player["id"]):
		var level := _property_level(tile_id)
		if level < 3:
			pending_upgrade_tile = tile
			phase = PHASE_WAITING_DECISION
			var cost := _upgrade_cost(tile)
			_log("%s 可以升级 %s，费用 %d 元，当前 %d 级。" % [player["name"], tile["name"], cost, level])
			if bool(player["is_ai"]):
				await get_tree().create_timer(0.7).timeout
				if int(player["money"]) >= cost + 350:
					_on_upgrade_pressed()
				else:
					_on_skip_pressed()
			else:
				_refresh_all()
		else:
			_log("%s 来到自己的满级地产 %s。" % [player["name"], tile["name"]])
			_end_or_wait()
		return

	var owner := _player_by_id(owner_id)
	var rent := _rent_for_tile(tile)
	_transfer_money(player, owner, rent)
	_log("%s 向 %s 支付 %s Lv.%d 租金 %d 元。" % [player["name"], owner["name"], tile["name"], _property_level(tile_id), rent])
	_after_money_changed()
	_end_or_wait()


func _draw_and_apply_card(player: Dictionary) -> void:
	if chance_cards.is_empty():
		return
	var card: Dictionary = chance_cards[rng.randi_range(0, chance_cards.size() - 1)] as Dictionary
	_log("%s 抽到：%s。" % [player["name"], card["title"]])
	_show_message(card["title"], card["description"], false)
	await get_tree().create_timer(1.0 if bool(player["is_ai"]) else 1.4).timeout
	_hide_overlay()
	await _apply_card(player, card)
	_after_money_changed()


func _apply_card(player: Dictionary, card: Dictionary) -> void:
	match String(card["effect"]):
		"ADD_MONEY":
			_add_money(player, int(card["amount"]))
		"REMOVE_MONEY":
			_remove_money(player, int(card["amount"]))
		"MOVE_TO":
			var target := int(card["target_tile"])
			player["position"] = target
			_update_piece_position(player, true)
			if bool(card.get("grant_start_bonus", false)):
				_add_money(player, start_bonus)
			await get_tree().create_timer(0.18).timeout
		"MOVE_RELATIVE":
			var steps := int(card["steps"])
			if steps >= 0:
				await _move_current_player(steps)
			else:
				for i in range(abs(steps)):
					player["position"] = (int(player["position"]) - 1 + board_tiles.size()) % board_tiles.size()
					_update_piece_position(player, true)
					await get_tree().create_timer(0.12).timeout
		"COLLECT_FROM_ALL":
			for other in players:
				if int(other["id"]) != int(player["id"]) and other["status"] == "active":
					_transfer_money(other, player, int(card["amount"]))
		"PAY_ALL":
			for other in players:
				if int(other["id"]) != int(player["id"]) and other["status"] == "active":
					_transfer_money(player, other, int(card["amount"]))
		"MOVE_RANDOM":
			player["position"] = rng.randi_range(0, board_tiles.size() - 1)
			_update_piece_position(player, true)
			await get_tree().create_timer(0.18).timeout
		"DEMOLISH_OPPONENT":
			_demolish_random_opponent_house(player)
		"UPGRADE_SELF":
			_upgrade_random_own_house(player)


func _demolish_random_opponent_house(player: Dictionary) -> void:
	var candidates: Array[int] = []
	for tile_id_value in property_levels.keys():
		var tile_id := int(tile_id_value)
		if property_owners.has(tile_id) and int(property_owners[tile_id]) != int(player["id"]) and _property_level(tile_id) > 0:
			candidates.append(tile_id)
	if candidates.is_empty():
		_log("拆迁令没有找到可摧毁的对手房屋。")
		return
	var target_id := candidates[rng.randi_range(0, candidates.size() - 1)]
	var old_level := _property_level(target_id)
	property_levels[target_id] = old_level - 1
	var tile: Dictionary = tile_by_id[target_id] as Dictionary
	_style_tile(tile_buttons[target_id] as Button, tile)
	var owner := _player_by_id(int(property_owners[target_id]))
	_log("%s 摧毁了 %s 的 %s，等级 %d -> %d。" % [player["name"], owner["name"], tile["name"], old_level, old_level - 1])


func _upgrade_random_own_house(player: Dictionary) -> void:
	var candidates: Array[int] = []
	for tile_id_value in player["properties"]:
		var tile_id := int(tile_id_value)
		if property_owners.has(tile_id) and int(property_owners[tile_id]) == int(player["id"]) and _property_level(tile_id) < 3:
			candidates.append(tile_id)
	if candidates.is_empty():
		_log("装修补贴没有找到可升级的自有房产。")
		return
	var target_id := candidates[rng.randi_range(0, candidates.size() - 1)]
	var old_level := _property_level(target_id)
	property_levels[target_id] = old_level + 1
	var tile: Dictionary = tile_by_id[target_id] as Dictionary
	_style_tile(tile_buttons[target_id] as Button, tile)
	_log("%s 免费升级了 %s，等级 %d -> %d。" % [player["name"], tile["name"], old_level, old_level + 1])


func _on_buy_pressed() -> void:
	if phase != PHASE_WAITING_DECISION or pending_purchase_tile == null:
		return
	var player := _current_player()
	var tile: Dictionary = pending_purchase_tile as Dictionary
	var price := int(tile["price"])
	if int(player["money"]) < price:
		_log("%s 资金不足，购买失败。" % [player["name"]])
		_on_skip_pressed()
		return
	_remove_money(player, price)
	property_owners[int(tile["id"])] = int(player["id"])
	property_levels[int(tile["id"])] = 0
	player["properties"].append(int(tile["id"]))
	_style_tile(tile_buttons[int(tile["id"])] as Button, tile)
	_log("%s 购买了 %s。" % [player["name"], tile["name"]])
	pending_purchase_tile = null
	_after_money_changed()
	_end_or_wait()


func _on_upgrade_pressed() -> void:
	if phase != PHASE_WAITING_DECISION or pending_upgrade_tile == null:
		return
	var player := _current_player()
	var tile: Dictionary = pending_upgrade_tile as Dictionary
	var tile_id := int(tile["id"])
	var level := _property_level(tile_id)
	if level >= 3:
		_log("%s 已经满级，无法继续升级。" % [tile["name"]])
		pending_upgrade_tile = null
		_end_or_wait()
		return
	var cost := _upgrade_cost(tile)
	if int(player["money"]) < cost:
		_log("%s 资金不足，无法升级 %s。" % [player["name"], tile["name"]])
		_on_skip_pressed()
		return
	_remove_money(player, cost)
	property_levels[tile_id] = level + 1
	_style_tile(tile_buttons[tile_id] as Button, tile)
	_log("%s 将 %s 升到 %d 级，花费 %d 元。" % [player["name"], tile["name"], level + 1, cost])
	pending_upgrade_tile = null
	_after_money_changed()
	_end_or_wait()


func _on_skip_pressed() -> void:
	if phase != PHASE_WAITING_DECISION:
		return
	var player := _current_player()
	if pending_purchase_tile != null:
		_log("%s 跳过购买 %s。" % [player["name"], pending_purchase_tile["name"]])
	elif pending_upgrade_tile != null:
		_log("%s 暂不升级 %s。" % [player["name"], pending_upgrade_tile["name"]])
	pending_purchase_tile = null
	pending_upgrade_tile = null
	_end_or_wait()


func _on_end_pressed() -> void:
	if phase != PHASE_TURN_END:
		return
	_advance_to_next_player()
	if mode_option.get_selected_id() == 0 and round_number > max_rounds:
		_finish_game("%d 回合资产结算" % [max_rounds])
		return
	_start_turn()


func _end_or_wait() -> void:
	if phase == PHASE_GAME_OVER:
		return
	_after_money_changed()
	if _check_game_end():
		return
	phase = PHASE_TURN_END
	_refresh_all()
	if bool(_current_player()["is_ai"]):
		await get_tree().create_timer(0.7).timeout
		_on_end_pressed()


func _advance_to_next_player() -> void:
	var previous := current_player_index
	for i in range(players.size()):
		current_player_index = (current_player_index + 1) % players.size()
		if current_player_index == 0 and previous != 0:
			round_number += 1
		if _current_player()["status"] == "active":
			return


func _after_money_changed() -> void:
	for player in players:
		if player["status"] == "active" and int(player["money"]) < 0:
			_mark_bankrupt(player)
	_refresh_all()


func _mark_bankrupt(player: Dictionary) -> void:
	player["status"] = "bankrupt"
	_log("%s 破产，退出游戏。" % [player["name"]])
	for tile_id in player["properties"]:
		property_owners.erase(int(tile_id))
		property_levels.erase(int(tile_id))
		if tile_buttons.has(int(tile_id)):
			_style_tile(tile_buttons[int(tile_id)] as Button, tile_by_id[int(tile_id)] as Dictionary)
	player["properties"].clear()
	if piece_nodes.has(int(player["id"])):
		piece_nodes[int(player["id"])].modulate = Color(1, 1, 1, 0.25)


func _check_game_end() -> bool:
	var active := _active_players()
	if active.size() <= 1:
		_finish_game("最后玩家胜利")
		return true
	if mode_option.get_selected_id() == 0 and round_number > max_rounds:
		_finish_game("%d 回合资产结算" % [max_rounds])
		return true
	return false


func _finish_game(reason: String) -> void:
	phase = PHASE_GAME_OVER
	var ranking := players.duplicate()
	ranking.sort_custom(func(a, b): return _calculate_assets(a) > _calculate_assets(b))
	var winner: Dictionary = ranking[0] as Dictionary
	var body := "[center]%s[/center]\n\n" % [reason]
	for i in range(ranking.size()):
		var player: Dictionary = ranking[i] as Dictionary
		body += "%d. %s  总资产 %d  现金 %d\n" % [i + 1, player["name"], _calculate_assets(player), int(player["money"])]
	_show_message("%s 获胜" % [winner["name"]], body, true)
	_log("游戏结束，%s 获胜。" % [winner["name"]])
	_refresh_all()


func _calculate_assets(player: Dictionary) -> int:
	var total := int(player["money"])
	for tile_id in player["properties"]:
		if tile_by_id.has(int(tile_id)):
			var tile: Dictionary = tile_by_id[int(tile_id)] as Dictionary
			total += int(tile.get("price", 0))
			total += _total_upgrade_value(tile)
	return total


func _property_level(tile_id: int) -> int:
	return int(property_levels.get(tile_id, 0))


func _upgrade_cost(tile: Dictionary) -> int:
	var tile_id := int(tile["id"])
	var next_level := _property_level(tile_id) + 1
	var base_cost := _base_upgrade_cost(tile)
	return base_cost * next_level


func _total_upgrade_value(tile: Dictionary) -> int:
	var tile_id := int(tile["id"])
	var total := 0
	var base_cost := _base_upgrade_cost(tile)
	for level in range(_property_level(tile_id)):
		total += base_cost * (level + 1)
	return total


func _base_upgrade_cost(tile: Dictionary) -> int:
	var fallback_cost: int = int(int(tile.get("price", 0)) / 2)
	if fallback_cost < 80:
		fallback_cost = 80
	return int(tile.get("upgrade_cost", fallback_cost))


func _rent_for_tile(tile: Dictionary) -> int:
	var level := _property_level(int(tile["id"]))
	return int(tile["rent"]) * (level + 1)


func _add_money(player: Dictionary, amount: int) -> void:
	player["money"] = int(player["money"]) + amount


func _remove_money(player: Dictionary, amount: int) -> void:
	player["money"] = int(player["money"]) - amount


func _transfer_money(from_player: Dictionary, to_player: Dictionary, amount: int) -> void:
	_remove_money(from_player, amount)
	_add_money(to_player, amount)


func _create_piece(player: Dictionary) -> void:
	var piece := PanelContainer.new()
	piece.custom_minimum_size = Vector2(34, 34)
	piece.size = Vector2(34, 34)
	piece.add_theme_stylebox_override("panel", _piece_style(String(player["color"])))
	var label := Label.new()
	label.text = str(int(player["id"]) + 1)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", Color("#FFFFFF"))
	piece.add_child(label)
	pieces_layer.add_child(piece)
	piece_nodes[int(player["id"])] = piece
	_update_piece_position(player, false)


func _update_piece_position(player: Dictionary, animated: bool) -> void:
	if not piece_nodes.has(int(player["id"])):
		return
	var player_id: int = int(player["id"])
	var piece: Control = piece_nodes[int(player["id"])] as Control
	var tile_button: Control = tile_buttons[int(player["position"])] as Control
	var offsets: Array[Vector2] = [Vector2(8, 8), Vector2(46, 8), Vector2(8, 46), Vector2(46, 46)]
	var target: Vector2 = tile_button.position + offsets[int(player["id"]) % offsets.size()]
	if piece_tweens.has(player_id):
		var old_tween: Tween = piece_tweens[player_id] as Tween
		if old_tween != null and old_tween.is_valid():
			old_tween.kill()
	if animated:
		var tween := create_tween()
		piece_tweens[player_id] = tween
		tween.tween_property(piece, "position", target, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	else:
		piece.position = target


func _clear_piece_tweens() -> void:
	for tween_value in piece_tweens.values():
		var tween: Tween = tween_value as Tween
		if tween != null and tween.is_valid():
			tween.kill()
	piece_tweens.clear()


func _refresh_all() -> void:
	var current: Dictionary = _current_player() if not players.is_empty() else {}
	turn_label.text = "第 %d / %d 回合" % [min(round_number, max_rounds), max_rounds]
	if not current.is_empty():
		subtitle_label.text = "当前：%s | 现金 %d | 资产 %d" % [current["name"], int(current["money"]), _calculate_assets(current)]
		phase_label.text = _phase_text()
	title_label.text = "桌面大富翁"
	_refresh_buttons()
	_refresh_player_list()
	for player in players:
		_update_piece_position(player, false)


func _refresh_buttons() -> void:
	roll_button.disabled = phase != PHASE_WAITING_ROLL or bool(_current_player().get("is_ai", false))
	end_button.disabled = phase != PHASE_TURN_END or bool(_current_player().get("is_ai", false))
	buy_button.disabled = phase != PHASE_WAITING_DECISION or pending_purchase_tile == null or bool(_current_player().get("is_ai", false))
	upgrade_button.disabled = phase != PHASE_WAITING_DECISION or pending_upgrade_tile == null or bool(_current_player().get("is_ai", false))
	skip_button.disabled = phase != PHASE_WAITING_DECISION or (pending_purchase_tile == null and pending_upgrade_tile == null) or bool(_current_player().get("is_ai", false))


func _refresh_player_list() -> void:
	for player in players:
		var row_data: Dictionary = _ensure_player_row(player)
		var card: PanelContainer = row_data["card"] as PanelContainer
		var dot: ColorRect = row_data["dot"] as ColorRect
		var name: Label = row_data["name"] as Label
		var meta: Label = row_data["meta"] as Label
		var border: String = String(player["color"]) if int(player["id"]) == int(_current_player().get("id", -1)) else "#D7DEE8"
		card.add_theme_stylebox_override("panel", _compact_panel_style("#FFFFFF", border, 6))
		dot.color = Color(String(player["color"]))
		var ai_suffix := " · AI" if bool(player["is_ai"]) else ""
		var status_suffix := " · 破产" if player["status"] != "active" else ""
		name.text = "%s%s%s" % [player["name"], ai_suffix, status_suffix]
		meta.text = "现金 %d | 地产 %d | 资产 %d" % [int(player["money"]), player["properties"].size(), _calculate_assets(player)]


func _ensure_player_row(player: Dictionary) -> Dictionary:
	var player_id: int = int(player["id"])
	if player_rows.has(player_id):
		return player_rows[player_id]

	var card := PanelContainer.new()
	card.custom_minimum_size = Vector2(0, 38)
	card.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	card.clip_contents = true
	card.add_theme_stylebox_override("panel", _compact_panel_style("#FFFFFF", "#D7DEE8", 6))
	player_list.add_child(card)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	card.add_child(row)

	var dot := ColorRect.new()
	dot.custom_minimum_size = Vector2(8, 30)
	row.add_child(dot)

	var text_box := VBoxContainer.new()
	text_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(text_box)

	var name := Label.new()
	name.clip_text = true
	name.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	name.add_theme_font_size_override("font_size", 13)
	name.add_theme_color_override("font_color", Color("#162033"))
	text_box.add_child(name)

	var meta := Label.new()
	meta.clip_text = true
	meta.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	meta.add_theme_font_size_override("font_size", 10)
	meta.add_theme_color_override("font_color", Color("#607087"))
	text_box.add_child(meta)

	var row_data := {
		"card": card,
		"dot": dot,
		"name": name,
		"meta": meta
	}
	player_rows[player_id] = row_data
	return row_data


func _phase_text() -> String:
	match phase:
		PHASE_WAITING_ROLL:
			return "等待掷骰"
		PHASE_MOVING:
			return "棋子移动中"
		PHASE_WAITING_DECISION:
			return "等待购买决定"
		PHASE_TURN_END:
			return "可结束回合"
		PHASE_GAME_OVER:
			return "游戏结束"
		_:
			return "准备中"


func _on_tile_hovered(tile: Dictionary) -> void:
	info_title.text = "%d · %s" % [int(tile["id"]), tile["name"]]
	info_body.text = _tile_description(tile)


func _tile_description(tile: Dictionary) -> String:
	var tile_type := String(tile["type"])
	var info: Dictionary = TYPE_INFO.get(tile_type, { "label": tile_type }) as Dictionary
	var lines: Array[String] = ["类型：%s" % [info["label"]]]
	if tile_type == "PROPERTY":
		var tile_id := int(tile["id"])
		var level := _property_level(tile_id)
		lines.append("价格：%d 元" % [int(tile["price"])])
		lines.append("等级：%d / 3" % [level])
		lines.append("租金：%d 元" % [_rent_for_tile(tile)])
		lines.append("组别：%s" % [String(tile.get("group", "-"))])
		if property_owners.has(int(tile["id"])):
			lines.append("所有者：%s" % [_player_by_id(int(property_owners[int(tile["id"])]))["name"]])
			if level < 3:
				lines.append("升级费用：%d 元" % [_upgrade_cost(tile)])
		else:
			lines.append("所有者：无")
	elif tile_type == "LOTTERY":
		lines.append("范围：%d 到 %d 元" % [int(tile.get("min_amount", -180)), int(tile.get("max_amount", 260))])
	elif tile_type == "MARKET":
		lines.append("每处地产收益：%d 元" % [int(tile.get("amount", 80))])
	elif tile_type == "TRANSIT":
		if tile.has("target_tile") and tile_by_id.has(int(tile["target_tile"])):
			lines.append("目的地：%s" % [tile_by_id[int(tile["target_tile"])]["name"]])
	elif tile.has("amount"):
		lines.append("金额：%d 元" % [int(tile["amount"])])
	if tile.has("next_ids"):
		var next_names: Array[String] = []
		for next_id in tile["next_ids"]:
			if tile_by_id.has(int(next_id)):
				next_names.append(String(tile_by_id[int(next_id)]["name"]))
		lines.append("分叉：%s" % [", ".join(next_names)])
	return "\n".join(lines)


func _style_tile(button: Button, tile: Dictionary) -> void:
	var tile_type := String(tile["type"])
	var type_info: Dictionary = TYPE_INFO.get(tile_type, TYPE_INFO["EMPTY"]) as Dictionary
	var base := Color(String(type_info["color"]))
	var bg := base.lightened(0.72)
	var border := base.darkened(0.08)
	button.text = "%d\n%s" % [int(tile["id"]), String(tile["name"])]
	if tile_type == "PROPERTY" and tile.has("group"):
		border = Color(GROUP_COLORS.get(String(tile["group"]), "#F6C85F"))
	if property_owners.has(int(tile["id"])):
		border = Color(String(_player_by_id(int(property_owners[int(tile["id"])]))["color"]))
		bg = border.lightened(0.76)
		var level := _property_level(int(tile["id"]))
		if level > 0:
			button.text = "%d\n%s\nLv.%d" % [int(tile["id"]), String(tile["name"]), level]
	button.add_theme_stylebox_override("normal", _panel_style(_color_hex(bg), _color_hex(border), 8))
	button.add_theme_stylebox_override("hover", _panel_style("#FFFFFF", _color_hex(border), 8))
	button.add_theme_stylebox_override("pressed", _panel_style(_color_hex(bg.darkened(0.08)), _color_hex(border), 8))
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	button.add_theme_color_override("font_color", Color("#182132"))
	button.add_theme_color_override("font_hover_color", Color("#182132"))
	button.add_theme_color_override("font_pressed_color", Color("#182132"))
	button.add_theme_color_override("font_focus_color", Color("#182132"))
	button.tooltip_text = _tile_description(tile)


func _show_message(title: String, body: String, game_over: bool) -> void:
	overlay_title.text = title
	overlay_body.text = body
	overlay_secondary.visible = game_over
	overlay_primary.text = "继续" if not game_over else "留在结算"
	overlay.visible = true


func _hide_overlay() -> void:
	overlay.visible = false


func _log(message: String) -> void:
	if log_list == null:
		return
	log_entries.append(message)
	while log_entries.size() > 7:
		log_entries.pop_front()
	_refresh_log_rows()


func _clear_logs() -> void:
	log_entries.clear()
	_refresh_log_rows()


func _build_log_rows() -> void:
	log_labels.clear()
	_clear_children(log_list)
	for i in range(7):
		var label := Label.new()
		label.text = ""
		label.custom_minimum_size = Vector2(0, 14)
		label.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
		label.clip_text = true
		label.autowrap_mode = TextServer.AUTOWRAP_OFF
		label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		label.add_theme_font_size_override("font_size", 11)
		label.add_theme_color_override("font_color", Color("#D9E3F0"))
		log_list.add_child(label)
		log_labels.append(label)


func _refresh_log_rows() -> void:
	for i in range(log_labels.size()):
		var label: Label = log_labels[i]
		var entry_index := log_entries.size() - log_labels.size() + i
		label.text = log_entries[entry_index] if entry_index >= 0 else ""


func _clear_children(node: Node) -> void:
	for child in node.get_children():
		node.remove_child(child)
		child.queue_free()


func _current_player() -> Dictionary:
	if players.is_empty():
		return {}
	return players[current_player_index]


func _player_by_id(id: int) -> Dictionary:
	for player in players:
		if int(player["id"]) == id:
			return player
	return {}


func _active_players() -> Array:
	var active: Array = []
	for player in players:
		if player["status"] == "active":
			active.append(player)
	return active


func _on_menu_player_count_changed(_index: int) -> void:
	var count := player_count_option.get_selected_id()
	for i in range(name_inputs.size()):
		name_inputs[i].editable = i < count
		name_inputs[i].modulate = Color(1, 1, 1, 1) if i < count else Color(1, 1, 1, 0.35)
		ai_checkboxes[i].disabled = i >= count
		ai_checkboxes[i].modulate = Color(1, 1, 1, 1) if i < count else Color(1, 1, 1, 0.35)


func _field_row(label_text: String, control: Control) -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	var label := Label.new()
	label.text = label_text
	label.custom_minimum_size = Vector2(104, 0)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color("#4D5D72"))
	row.add_child(label)
	control.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(control)
	return row


func _make_option_button() -> OptionButton:
	var option := OptionButton.new()
	option.custom_minimum_size = Vector2(0, 42)
	option.add_theme_stylebox_override("normal", _panel_style("#FFFFFF", "#D7DEE8", 8))
	option.add_theme_stylebox_override("hover", _panel_style("#FFFFFF", "#9AB2CE", 8))
	option.add_theme_color_override("font_color", Color("#162033"))
	return option


func _make_action_button(text: String) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(108, 38)
	_style_button(button, "#243044", "#31415C", "#1D2738", "#F8FAFC")
	return button


func _style_button(button: Button, bg: String, hover: String, pressed: String, text_color: String) -> void:
	button.add_theme_stylebox_override("normal", _panel_style(bg, bg, 8))
	button.add_theme_stylebox_override("hover", _panel_style(hover, hover, 8))
	button.add_theme_stylebox_override("pressed", _panel_style(pressed, pressed, 8))
	button.add_theme_stylebox_override("disabled", _panel_style("#CBD5E1", "#CBD5E1", 8))
	button.add_theme_color_override("font_color", Color(text_color))
	button.add_theme_color_override("font_disabled_color", Color("#64748B"))
	button.add_theme_font_size_override("font_size", 15)


func _section_title(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 17)
	label.add_theme_color_override("font_color", Color("#162033"))
	return label


func _side_label(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", Color("#4D5D72"))
	return label


func _panel_style(bg: String, border: String, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(bg)
	style.border_color = Color(border)
	style.set_border_width_all(1)
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 14
	style.content_margin_bottom = 14
	return style


func _compact_panel_style(bg: String, border: String, radius: int) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(bg)
	style.border_color = Color(border)
	style.set_border_width_all(1)
	style.corner_radius_top_left = radius
	style.corner_radius_top_right = radius
	style.corner_radius_bottom_left = radius
	style.corner_radius_bottom_right = radius
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 6
	style.content_margin_bottom = 6
	return style


func _piece_style(color: String) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(color)
	style.border_color = Color("#FFFFFF")
	style.set_border_width_all(3)
	style.corner_radius_top_left = 18
	style.corner_radius_top_right = 18
	style.corner_radius_bottom_left = 18
	style.corner_radius_bottom_right = 18
	return style


func _color_hex(color: Color) -> String:
	return "#" + color.to_html(false)

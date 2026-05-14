# Dafuweng Desktop

一个基于 Godot 4 的电脑端 2D 大富翁类游戏原型。当前版本实现了开发计划中的 MVP 闭环：

- 主菜单与玩家配置
- 28 格数据驱动棋盘
- 2 到 4 名本地玩家，支持简单 AI
- 回合、掷骰、逐格移动
- 起点工资、买地、收租、税收、奖励、惩罚
- 机会卡事件
- 破产释放地产
- 30 回合资产结算与淘汰胜利
- 4 张可选地图：经典环线、蛇形城区、分叉港湾、庆典城市

## 运行

1. 安装 Godot 4.x。
2. 用 Godot 打开本目录。
3. 运行主场景 `res://scenes/main/Main.tscn`。

## 目录

```text
data/
  board_tiles.json
  board_tiles_snake.json
  board_tiles_branch.json
  board_tiles_festival.json
  chance_cards.json
  config.json
scenes/main/
  Main.tscn
  Main.gd
docs/
  rules.md
```

后续迭代建议优先拆分 `GameManager`、`BoardManager`、`EconomyManager`、`EventManager`，并补充存档、交易、建房和地图编辑器。


// Это сценарии для изучения DOM JavaScript а также принципов динаимческаго Html

// событие загрузки HTML страницы. Определение событий идет только после того, как произошла загрузка
// иначе возникают ошибки из=за не определения объектов

// ГЛОБАЛЬНЫЕ ОБЪЕКТЫ
// настройки и параметры игры
var CORNERS;

window.onload = function () 
{
	// начальные установки игры
	CORNERS = 
	{
		divField: document.getElementById("divField"), //DIV в катором строится игровое поле
		divPrint: document.getElementById("divInfo"), // DIV, в который печатается информация об игре
		divControl: document.getElementById("divControl"), // панель настроёк игры
		url_w: "w.gif", // картинка для белых
		url_b: "b.gif", // картинка для черных
		l: 750, // длина игрового поля
		w: 750, // ширина поля 
		chips: new Array(8), // виртуальное поле
		goal_game: new Array(8), // цель игры
		open_moves: new Array(8), // открытые ходы текущего хода
		focus: {flag: 0, i: undefined, j: undefined, open_moves: new Array()}, // информация о доступных ходах
		player_w: 0, // 0 - игрок, 1 - комп, 2 - сеть
		player_b: 0, // 0 - игрок, 1 - комп, 2 - сеть
		player_move: 1, // показывает, кокой игрок(черные или белые) сейчас ходят
		move: 	// переменная для запоминания хода
		{
			i1 : null,
			i2 : null,
			j1 : null,
			j2 : null
		},
		end: 0, // 0 = игра, 1 - победа белых, 2 - победа черных, 3 - ничья
		// настройки для игры по сети
		divMessage: null, // сюда записывается DIV для вывода сообщений 
		thisPlayer: null, // "цвет" этого клиента. 1 - белые, 2 - черные
		noGame: null, // номер сетевой игры
		currentMove: null, // сюда  записывается текущий ход, для отпрааки его на сервер, при ходе этого клиента
		setTime: 2000, // период запросов в серверу в режиме ожидания
		intervalID: null // служебная переменная, для работы с таймерами. 
	}; 

	resizeWindow();

	document.getElementById("typeGame1").onclick = function()
	{
		new_game(0, 11);
	};

	document.getElementById("typeGame2").onclick = function()
	{
		if (document.getElementById("whiteChipsUser").checked)
		{
			new_game(0, 01);
		}
		else
		{
			new_game(1, 10);
		}
	};

	document.getElementById("typeGame3").onclick = function()
	{
		new_game(0, 00);
	};

	document.getElementById("newGameNetwork").onclick = function()
	{
		new_game_on_the_network(1);
	};

	document.getElementById("connectGameNetwork").onclick = function()
	{
		new_game_on_the_network(2);
	};
};

//запускает игру!

// создание сетевой игры
// @param: mode(int) - режим начала игры(создание новой игры(mode = 0) - белые, подключение к игре(mode = 1) - черные) 

function new_game_on_the_network(mode)
{
	if (CORNERS.intervalID !== null)
	{
		clearInterval(CORNERS.intervalID);
	}

	if (CORNERS.reset)
	{
		CORNERS.divField.innerHTML = "";
	}
	else
	{
		CORNERS.l = CORNERS.l/8;
		CORNERS.w = CORNERS.w/8;
	}

	forming_a_grid(); // фурмируется "сетка"" поля
	crate_array_chips(3); // создается служебный массив(массив для выделения фишек) 
	CORNERS.end = 0; // играть!
	CORNERS.player_move = 1; // первый ход белого
	CORNERS.reset = 1;
	// если игрок создает игру, то он ходит белыми и первым
	if (mode == 1)
	{
		arrangement_of_checkers(0);
		CORNERS.player_w = 0;// установка белых
		CORNERS.player_b = 2;// устоновка черных
		CORNERS.thisPlayer = 1;// этот игрок белый(игорок этого клиента)
		// запрос на создание игры
		$.ajax(
		{
			url: "ajax.php",
			type: "GET",
			dataType: "json",
			data: 
			{
				start_game: 1,
				player: CORNERS.thisPlayer
			},
			success: function(data)
					{
						createMessage(1, data.noGame);
					},

			error: function()
					{
						CORNERS.divPrint.innerHTML = "Неизвестная ошибка соединения с сервером!"
					}		
		});
	}
	else
	{
		arrangement_of_checkers(1);
		CORNERS.player_w = 2;// установка белых
		CORNERS.player_b = 0;// устоновка черных
		CORNERS.thisPlayer = 2;// этот игрок черный(игорок этого клиента)
		createMessage(2);
	}
}


// создание одиночной и парной игры (на одном компьютере)
// @param: type_arrange - тип растоновки. 0 - белые в нижнем углу, инвче черные
//			type_game - тип игры. 00 - мультиплеер, 01 и 10 - игрок проитив AI, 11 - AI aginst AI 

function new_game(type_arrange, type_game)
{
	if (CORNERS.intervalID !== null)
	{
		clearInterval(CORNERS.intervalID);
	}

	if (CORNERS.thisPlayer !== null)
	{
		CORNERS.thisPlayer = null;
	}

	// расчитывается ширина и длина клетки
	if (CORNERS.reset)
	{
	 	CORNERS.divField.innerHTML = "";
	}
	else
	{
		CORNERS.l = CORNERS.l/8;
		CORNERS.w = CORNERS.w/8;
	}

	// фурмируется "сетка"" поля
	forming_a_grid();
	// растановка фишек на поле
	arrangement_of_checkers(type_arrange);
	// установка игроков, в зависимости от второго параметра
	switch(type_game)
	{
		case 01:
			CORNERS.player_w = 0;
			CORNERS.player_b = 1;
		break;	

		case 10:
			CORNERS.player_w = 1;
			CORNERS.player_b = 0;
		break;	

		case 11:
			CORNERS.player_w = 1;
			CORNERS.player_b = 1;
		break;
		
		default:
			CORNERS.player_w = 0;
			CORNERS.player_b = 0;
	}

	// первым ходит белый
	CORNERS.player_move = 1;
	crate_array_chips(3);
	provision_of_trevel();
	print_info_of_game();
	CORNERS.reset = 1;
	CORNERS.end = 0;
}



// Предоставление хода
function provision_of_trevel()
{
	calculation_moves();

	if (CORNERS.player_move == 1)
	{
		if (CORNERS.player_w == 1)
		{
			moves_AI_1();
		}
		else
		{
			if (CORNERS.player_w == 2)
			{
				moveUserToNetwork();
			}
			else
			{
				visibility_cells_user();
			}
		}
	}
	else
	{
		if (CORNERS.player_b == 1)
		{
			moves_AI_1();
		}
		else
		{
			if (CORNERS.player_b == 2)
			{
				moveUserToNetwork();
			}
			else
			{
				visibility_cells_user();
			}
		}		
	}
}



// нахождение возможных ходов
function calculation_moves_chips(i, j)
{
	// "поворот" обхода
	var rote = 1;
	// флаг, то что ближайшиее искать не стоит
	// при обходе, после "прыжка"
	var flag = 0;
	// Данный массив хранит цепочку обхода элементов, при нахождении всех возможных вариантов
	var path = new Array(0);
	path[0] = new Array(2);
	path[0][0] = i;
	path[0][1] = j;
	// данный массив будет хранить "отработанные" клетки
	var traveled = new Array(8);

	for (var m = 0; m < 8; m++)
	{
		traveled[m] = new Array(8);
	}

	for (var m = 0; m < 8; m++)
	{
		for (var n = 0; n < 8; n++)
		{
			traveled[m][n] = 0;
		}
	}

	// РЕЗУЛЬТАТ работы данной функции, мвссив содержащий позиции клеток,
	// в которые можно сделать ход
	var result = new Array();

	while (rote < 5)
	{
		i =  path[0][0];
		j =  path[0][1];

		if (rote == 1)
		{
			if (i > 0 && CORNERS.chips[i-1][j] == 0)
			{
				if (flag == 0)
				{
					traveled[i - 1][j] = 1;
					result[result.length] = new Array(2);
					result[result.length - 1][0] = i - 1;
					result[result.length - 1][1] = j;
				}
			}
			else
			{
				if (i > 1 && CORNERS.chips[i-2][j] == 0 && traveled[i-2][j] == 0)
				{
					traveled[i-2][j] = 1;
					result[result.length] = new Array(2);
					result[result.length - 1][0] = i - 2;
					result[result.length - 1][1] = j;
					path[path.length] = new Array(2);
					path[path.length - 1][0] = i - 2;
					path[path.length - 1][1] = j;
				}
			}
		}
		else
		{
			if (rote == 2)
			{
				if ((j + 1) < 8 && CORNERS.chips[i][j+1] == 0)
				{
					if (flag == 0)
					{
						traveled[i][j + 1] = 1;
						result[result.length] = new Array(2);
						result[result.length - 1][0] = i;
						result[result.length - 1][1] = j + 1;
					}
				}
				else
				{
					if ((j + 2) < 8 && CORNERS.chips[i][j+2] == 0 && traveled[i][j+2] == 0)
					{
						traveled[i][j+2] = 1;
						result[result.length] = new Array(2);
						result[result.length - 1][0] = i;
						result[result.length - 1][1] = j + 2;
						path[path.length] = new Array(2);
						path[path.length - 1][0] = i;
						path[path.length - 1][1] = j + 2;	
					}
				}
			}
			else
			{
				if (rote == 3)
				{
					if ((i + 1) < 8 && CORNERS.chips[i+1][j] == 0)
					{	
						if (flag == 0)
						{
							traveled[i + 1][j] = 1;
							result[result.length] = new Array(2);
							result[result.length - 1][0] = i + 1;
							result[result.length - 1][1] = j;
						}
					}
					else
					{
						if ((i + 2) < 8 && CORNERS.chips[i+2][j] == 0 && traveled[i+2][j] == 0)
						{
							traveled[i + 2][j] = 1;
							result[result.length] = new Array(2);
							result[result.length - 1][0] = i + 2;
							result[result.length - 1][1] = j;
							path[path.length] = new Array(2);
							path[path.length - 1][0] = i + 2;
							path[path.length - 1][1] = j;	
						}
					}
				}
				else
				{
					if (j > 0 && CORNERS.chips[i][j-1] == 0)
					{
						if (flag == 0)
						{	
							traveled[i][j - 1] = 1;
							result[result.length] = new Array(2);
							result[result.length - 1][0] = i;
							result[result.length - 1][1] = j - 1;
						}
					}
					else
					{
						if (j > 1 && CORNERS.chips[i][j-2] == 0 && traveled[i][j-2] == 0)
						{
							traveled[i][j - 2] = 1;
							result[result.length] = new Array(2);
							result[result.length - 1][0] = i;
							result[result.length - 1][1] = j - 2;
							path[path.length] = new Array(2);	
							path[path.length - 1][0] = i;
							path[path.length - 1][1] = j - 2;
						}
					}

					flag = 1;

					if (path.length > 1)
					{
						path[0][0] = path[1][0];
						path[0][1] = path[1][1];
						path.splice(1, 1);
						rote = 0;
					}
				}
			}
		}

		rote++;
	}

	return result;
} 



// данная функция ищет в текущем ходе возможные ходы 
// все эти ходы записывваются в массив CORNERS.open_moves(четырехмерный)

function calculation_moves()
{
	var div;
	var flag = 0;

	if (CORNERS.player_move == 1)
	{
		var max = 100;
		var min = 0;
 	}
 	else
 	{
 		var max = 0;
		var min = -100;
 	}

	for (var i = 0; i < 8; i++)
	{
		for (var j = 0; j < 8; j++)
		{
			if (CORNERS.chips[i][j] < max && CORNERS.chips[i][j] > min)
			{
				for (var rote = 1; rote < 5; rote++)
				{
					if (rote == 1)
					{
						if (i > 0 && CORNERS.chips[i-1][j] == 0)
						{
							flag = 1;
							break;	
						}
						else
						{
							if (i > 1 && CORNERS.chips[i-2][j] == 0)
							{
								flag = 1;
								break;	
							}
						}
					}
					else
					{
						if (rote == 2)
						{
							if ((j + 1) < 8 && CORNERS.chips[i][j+1] == 0)
							{
								flag = 1;
								break;	
							}
							else
							{
								if ((j + 2) < 8 && CORNERS.chips[i][j+2] == 0)
								{
									flag = 1;
									break;	
								}
							}
						}
						else
						{
							if (rote == 3)
							{
								if ((i + 1) < 8 && CORNERS.chips[i+1][j] == 0)
								{
									flag = 1;
									break;	
								}
								else
								{
									if ((i + 2) < 8 && CORNERS.chips[i+2][j] == 0)
									{
										flag = 1;
										break;	
									}
								}
							}
							else
							{
								if (j > 0 && CORNERS.chips[i][j-1] == 0)
								{
									flag = 1;
									break;	
								}
								else
								{
									if (j > 1 && CORNERS.chips[i][j-2] == 0)
									{
										flag = 1;
										break;	
									}
								}	
							}
						}
					}
				}

				if (flag == 1)
				{
					CORNERS.open_moves[i][j] = new Array();
					CORNERS.open_moves[i][j] = calculation_moves_chips(i, j);
				}
				else
				{
					CORNERS.open_moves[i][j] = 0;
				}
			}
			else
			{
				CORNERS.open_moves[i][j] = 0;
			}
		}
	}		
}

// СОКРЫТИЕ "ненужных" клеток
// когда ходит игрок
// "нужные" открываются

function visibility_cells_user()
{
	var div;

	for (var i = 0; i < 8; i++)
	{
		for (var j = 0; j < 8; j++)
		{
			div = document.getElementById("idCell" + i + j)

			if (CORNERS.open_moves[i][j] == 0)
			{
				div.style.display = "none";
			}
			else
			{
				div.style.display = "block";
			}
		}
	}
}

// ПЕЧАТАЕТ вид игры и какой игрок ходит
// 

function print_info_of_game()
{
	var div = CORNERS.divPrint; 

	if (CORNERS.end != 0)
	{
		if (CORNERS.end == 1)
		{
			div.innerHTML = "<BR/> Игра закончена! Победили ЧЕРНЫЕ!";
		}
		else
		{
			if (CORNERS.end == 2)
			{	
				div.innerHTML = "<BR/> Игра закончена! Победили БЕЛЫЕ!";
			}	
			else
			{	
				div.innerHTML = "<BR/> Игра закончена! НИЧЬЯ !";
			}
		}			
	}		
	else
	{	
		if (CORNERS.player_move == 1)
		{
			if (CORNERS.player_w == 0)
			{
				div.innerHTML = "<BR/> ходят БЕЛЫЕ <BR/> Делай свой ход ИГРОК за белых!";
			}
			else
			{
				if(CORNERS.player_w == 2)
				{
					div.innerHTML = "<BR/> ходят БЕЛЫЕ <BR/> Ходит 'удалённый' ИГРОК!";
				}
				else
				{
					div.innerHTML = "<BR/> ходят БЕЛЫЕ <BR/> Ходит КОМПЬЮТЕР!";
				}
			}
		}
		else
		{
			if (CORNERS.player_b == 0)
			{
				div.innerHTML = "<BR/> ходят ЧЕРНЫЕ <BR/> Делай свой ход ИГРОК за черных!";
			}
			else
			{
				if (CORNERS.player_b == 2)
				{
					div.innerHTML = "<BR/> ходят ЧЕРНЫЕ <BR/> Ходит 'удалённый' ИГРОК!";
				}
				else
				{
					div.innerHTML = "<BR/> ходят ЧЕРНЫЕ <BR/> Ходит КОМПЬЮТЕР!";
				}
			}
		}
	}	
}



// формирование сетки поля 
// @param lenght(number) - длина поля, wdth(number) - ширина поля, cell_w -размер ячейки поля
// 							div_field - id блока, в котором размещается игровое поле 

function forming_a_grid()
{
	var div = CORNERS.divField;

	for (var i = 0; i < 8; i++)
	{	
		for (var j = 0; j < 8; j++)
		{
			cell = document.createElement("DIV");
			cell.style.zIndex = 2;
			cell.style.width = (CORNERS.w - 10) + "px";
			cell.style.height = (CORNERS.l - 10) + "px";
			cell.style.border = "none";
			cell.style.position = "absolute";
			cell.style.top = i * CORNERS.w + "px";
			cell.style.left = j * CORNERS.l + "px";
			cell.style.display = "none";
			id = "idCell" + i + j;
			cell.setAttribute("id",id);
			div.appendChild(cell);
			cell.setAttribute("onmouseover", "javascript: displaying_of_cell('" + id + "'," + i + "," + j + ", 1)");
			cell.setAttribute("onmouseout", "javascript: displaying_of_cell('" + id + "'," + i + "," + j + ", 2)");
			cell.setAttribute("onclick", "javascript: click_cell('" + id + "'," + i + "," + j + ")");
		}
	}		
} 


// "ЗАЖИГАЕТ" данную клетку

function displaying_of_cell(id, i, j, flag_move)
{
	var div = document.getElementById(id);
	var flag_is = 0;
	var length;

	if (flag_move == 1)
	{
		div.style.border = "5px solid #0F0";
	}
	else
	{
		if (CORNERS.focus.flag == 1)
		{
			if (CORNERS.focus.i == i && CORNERS.focus.j == j)
			{
				div.style.border = "5px solid #F00";
			}
			else
			{
				div.style.border = "5px solid #00F";
			}
		}
		else
		{
			div.style.border = "none";
		}	
	}
}



// создает пустой массив расстановок фишек или массив цели
//
// @param type(number) 0 - массив растоновки фишек, 1 - массив цели, 2 - масссив открытых ходов

function crate_array_chips(type)
{
	for (var i = 0; i < 8; i++)
	{
		if (type == 0)
		{
			CORNERS.chips[i] = new Array(8);
		}
		else
		{
			if (type == 1)
			{
				CORNERS.goal_game[i] = new Array(8);
			}
			else
			{
				CORNERS.open_moves[i] = new Array(8);
			}
		}	
	}	

	for (var i = 0; i < 8; i++)
	{	
		for (var j = 0; j < 8; j++)
		{
			if (type == 0)
			{
				CORNERS.chips[i][j] = 0;
			}	
			else
			{
				if (type == 1)
				{
					CORNERS.goal_game[i][j] = 0;
				}	
				else
				{
					CORNERS.open_moves[i][j] = 0;
				}
			}
		}
	}
}

// данная функция растовляет фишки для уголков(растоновка №1)
// формирование массива 0 - растановок фишек, 1 - цели тгры
// @param  type_array - тип массива, type_arrange - тип расстановки

function arrange_corners_1(type_array, type_arrange)
{
	crate_array_chips(type_array);

	if (type_array == 0)
	{	
		if (type_arrange == 1)
		{
			for (var i = 0; i < 8; i++)
			{
				if (i == 0)
				{
					for (var j = 0; j < 5; j++)
					{
						CORNERS.chips[i][j] = 1;
					}
				}
				else
				{
					if (i == 1)
					{
						for (var j = 0; j < 4; j++)
						{
							CORNERS.chips[i][j] = 1;
						}
					}
					else
					{
						if (i == 2)
						{
							for (var j = 0; j < 3; j++)
							{
								CORNERS.chips[i][j] = 1;
							}
						}
						else
						{
							if (i == 3)
							{
								CORNERS.chips[3][0] = 1;
								CORNERS.chips[3][1] = 1;
								CORNERS.chips[3][7] = -1;
							}
							else
							{
								if (i == 4)
								{
									CORNERS.chips[4][0] = 1;
									CORNERS.chips[4][6] = -1;
									CORNERS.chips[4][7] = -1;
								}
								else
								{
									if (i == 5)
									{
										for (var j = 5; j < 8; j++)
										{
											CORNERS.chips[i][j] = -1;
										}
									}
									else
									{
										if (i == 6)
										{
											for (var j = 4; j < 8; j++)
											{	
												CORNERS.chips[i][j] = -1;
											}
										}
										else
										{
											for (var j = 3; j < 8; j++)
											{	
												CORNERS.chips[i][j] = -1;
											}
										}
									}
								}
							}
						}
					}

				}
			}
		}
		else
		{
			for (var i = 0; i < 8; i++)
			{
				if (i == 0)
				{
					for (var j = 0; j < 5; j++)
					{
						CORNERS.chips[i][j] = -1;
					}
				}
				else
				{
					if (i == 1)
					{
						for (var j = 0; j < 4; j++)
						{	
							CORNERS.chips[i][j] = -1;
						}
					}
					else
					{
						if (i == 2)
						{
							for (var j = 0; j < 3; j++)
							{
								CORNERS.chips[i][j] = -1;
							}
						}
						else
						{
							if (i == 3)
							{
								CORNERS.chips[3][0] = -1;
								CORNERS.chips[3][1] = -1;
								CORNERS.chips[3][7] = 1;
							}
							else
							{
								if (i == 4)
								{
									CORNERS.chips[4][0] = -1;
									CORNERS.chips[4][6] = 1;
									CORNERS.chips[4][7] = 1;
								}
								else
								{
									if (i == 5)
									{
										for (var j = 5; j < 8; j++)
										{
											CORNERS.chips[i][j] = 1;
										}
									}
									else
									{
										if (i == 6)
										{
											for (var j = 4; j < 8; j++)
											{
												CORNERS.chips[i][j] = 1;
											}
										}
										else
										{
											for (var j = 3; j < 8; j++)
											{	
												CORNERS.chips[i][j] = 1;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}	
	else
	{
		if (type_arrange == 1)
		{
			for (var i = 0; i < 8; i++)
			{
				if (i == 0)
				{
					for (var j = 0; j < 5; j++)
					{
						CORNERS.goal_game[i][j] = -1;
					}
				}
				else
				{
					if (i == 1)
					{
						for (var j = 0; j < 4; j++)
						{
							CORNERS.goal_game[i][j] = -1;
						}
					}
					else
					{
						if (i == 2)
						{
							for (var j = 0; j < 3; j++)
							{
								CORNERS.goal_game[i][j] = -1;
							}
						}
						else
						{
							if (i == 3)
							{
								CORNERS.goal_game[3][0] = -1;
								CORNERS.goal_game[3][1] = -1;
								CORNERS.goal_game[3][7] = 1;
							}
							else
							{
								if (i == 4)
								{
									CORNERS.goal_game[4][0] = -1;
									CORNERS.goal_game[4][6] = 1;
									CORNERS.goal_game[4][7] = 1;
								}
								else
								{
									if (i == 5)
									{
										for (var j = 5; j < 8; j++)
										{
											CORNERS.goal_game[i][j] = 1;
										}
									}
									else
									{
										if (i == 6)
										{
											for (var j = 4; j < 8; j++)
											{
												CORNERS.goal_game[i][j] = 1;
											}
										}
										else
										{
											for (var j = 3; j < 8; j++)
											{
												CORNERS.goal_game[i][j] = 1;
											}
										}
									}
								}
							}
						}
					}

				}
			}
		}
		else
		{
			for (var i = 0; i < 8; i++)
			{
				if (i == 0)
				{
					for (var j = 0; j < 5; j++)
					{
						CORNERS.goal_game[i][j] = 1;
					}
				}
				else
				{
					if (i == 1)
					{
						for (var j = 0; j < 4; j++)
						{
							CORNERS.goal_game[i][j] = 1;
						}
					}
					else
					{
						if (i == 2)
						{
							for (var j = 0; j < 3; j++)
							{
								CORNERS.goal_game[i][j] = 1;
							}
						}
						else
						{
							if (i == 3)
							{
								CORNERS.goal_game[3][0] = 1;
								CORNERS.goal_game[3][1] = 1;
								CORNERS.goal_game[3][7] = -1;
							}
							else
							{
								if (i == 4)
								{
									CORNERS.goal_game[4][0] = 1;
									CORNERS.goal_game[4][6] = -1;
									CORNERS.goal_game[4][7] = -1;
								}
								else
								{
									if (i == 5)
									{
										for (var j = 5; j < 8; j++)
										{
											CORNERS.goal_game[i][j] = -1;
										}
									}
									else
									{
										if (i == 6)
										{
											for (var j = 4; j < 8; j++)
											{
												CORNERS.goal_game[i][j] = -1;
											}
										}
										else
										{
											for (var j = 3; j < 8; j++)
											{
												CORNERS.goal_game[i][j] = -1;
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}


// данная функция роставляет по corners.chips фишки на поле

function arrangement_of_checkers(type_arrange)
{
	arrange_corners_1(0, type_arrange); 
	arrange_corners_1(1, type_arrange);
	var div = CORNERS.divField;
	var id = "";
	var img_of_chips;
	var chips;
	var div_goal;

	for (var i = 0; i < 8; i++)
	{
		for (var j = 0; j < 8; j++)
		{
			if (CORNERS.chips[i][j] != 0)
			{
				chips = document.createElement("DIV");
				chips.style.zIndex = 1;
				chips.style.width = CORNERS.w;
				chips.style.height = CORNERS.l;
				chips.style.padding = "5px";
				chips.style.position = "absolute";
				chips.style.top = i * CORNERS.l + "px";
				chips.style.left = j * CORNERS.w + "px";
				id = "" + (i + 1) + (j + 1);
				chips.setAttribute("id", id);
				div.appendChild(chips);
				img_of_chips = document.createElement("IMG");
				img_of_chips.style.width = CORNERS.w - 10 + 'px';
				img_of_chips.style.height = CORNERS.l - 10 + 'px';
				img_of_chips.style.backgroundSize = "cover";
				chips.appendChild(img_of_chips);

				if (CORNERS.chips[i][j] > 0)
				{
					CORNERS.chips[i][j] = parseInt(id);
					img_of_chips.setAttribute("src", CORNERS.url_w);
				}	
				else
				{
					CORNERS.chips[i][j] = -(parseInt(id));
					img_of_chips.setAttribute("src", CORNERS.url_b);
				}

				if (CORNERS.goal_game != 0)
				{
					div_goal = document.createElement("DIV");
					div_goal.style.zIndex = 0;
					div_goal.style.width = CORNERS.w + 'px';
					div_goal.style.height = CORNERS.l + 'px';
					div_goal.style.position = "absolute";
					div_goal.style.top = i * CORNERS.l + "px";
					div_goal.style.left = j * CORNERS.w + "px";

					if (CORNERS.goal_game[i][j] < 0)
					{
						div_goal.style.backgroundColor = "#000";
					}
					else
					{
						div_goal.style.backgroundColor = "#FFF";
					}

					div_goal.style.opacity = "0.2";
					div.appendChild(div_goal);
				}

				if (CORNERS.goal_game != 0)
				{
					div_goal = document.createElement("DIV");
					div_goal.style.zIndex = 0;
					div_goal.style.width = CORNERS.w + 'px';
					div_goal.style.height = CORNERS.l + 'px';
					div_goal.style.position = "absolute";
					div_goal.style.top = i * CORNERS.l + "px";
					div_goal.style.left = j * CORNERS.w + "px";

					if (CORNERS.goal_game[i][j] < 0)
					{
						if ((i-1) >= 0 && CORNERS.goal_game[i-1][j] == 0)
						{
							div_goal.style.borderTop = "5px solid #000";
						}

						if ((i+1) < 8 && CORNERS.goal_game[i+1][j] == 0)
						{
							div_goal.style.borderBottom = "5px solid #000";
						}

						if ((j-1) >= 0 && CORNERS.goal_game[i][j-1] == 0)
						{
							div_goal.style.borderLeft = "5px solid #000";
						}

						if ((j+1) < 8 && CORNERS.goal_game[i][j+1] == 0)
						{
							div_goal.style.borderRight = "5px solid #000";
						}
					}
					else
					{
						if ((i-1) >= 0 && CORNERS.goal_game[i-1][j] == 0)
						{
							div_goal.style.borderTop = "5px solid #FFF";
						}

						if ((i+1) < 8 && CORNERS.goal_game[i+1][j] == 0)
						{
							div_goal.style.borderBottom = "5px solid #FFF";
						}

						if ((j-1) >= 0 && CORNERS.goal_game[i][j-1] == 0)
						{
							div_goal.style.borderLeft = "5px solid #FFF";
						}

						if ((j+1) < 8 && CORNERS.goal_game[i][j+1] == 0)
						{
							div_goal.style.borderRight = "5px solid #FFF";
						}
					}

					div.appendChild(div_goal);
				}
		
			}
		}
	}
}


//данная_функция активизируется по клику 

function click_cell(id, i, j)
{
	if (CORNERS.focus.flag == 1)
	{
		CORNERS.focus.flag = 0;

		if (CORNERS.focus.i == i && CORNERS.focus.j == j)
		{	
			provision_of_trevel();
		}	
		else
		{
			hidden_selection_of_chips(CORNERS.focus.i, CORNERS.focus.j);

			if (CORNERS.thisPlayer !== null)
			{
				CORNERS.currentMove = '' + CORNERS.focus.i + CORNERS.focus.j + '_' + i + j;

				$.ajax(
				{
					url: "ajax.php",
					type: "GET", 
					dataType: "json",

					data: 
					{
						go_move: 1,
						move: CORNERS.currentMove,
						no_game: CORNERS.noGame,
						player: CORNERS.thisPlayer
					},

					success: function(data)
					{
						if (data.statusGame == 2 && data.otherPlayer == 1 && data.lastMove == CORNERS.currentMove)
						{
							moving_chips(CORNERS.focus.i, CORNERS.focus.j, i, j);
						}
						else
						{
							CORNERS.divPrint.innerHTML = "Возникли ошибки этой игры! С сервера поступили некорректные данные.";
						}
					},

					error: function()
					{
						CORNERS.divPrint.innerHTML = "Ошибка соединения с сервером! Ничего не могу поделать...";
					}
				});
			}
			else
			{
				moving_chips(CORNERS.focus.i, CORNERS.focus.j, i, j);
			}
		}
	}
	else
	{
		CORNERS.focus.flag = 1;
		CORNERS.focus.i = i;
		CORNERS.focus.j = j;
		visibliti_chips_focus(id, i, j);	
	}
}


// перемещает фишки

function moving_chips(i1, j1, i2, j2)
{
	if (CORNERS.player_move == 1)
	{
		$div = $('#' + CORNERS.chips[i1][j1]);
	}
	else
	{
		$div = $('#' + (-CORNERS.chips[i1][j1]));
	}

	$div.animate(
	{
		'top': i2 * CORNERS.l + 'px', 
		'left': j2 * CORNERS.w + 'px'
	},
	{
		duration: '700',
		easing: 'swing',
		complete: function() 
					{ 
						action_before_moving(i1, j1, i2, j2);
					}	    	
	});

	//активизируется после перемещения фишки
	function action_before_moving(i1, j1, i2, j2)
	{
		CORNERS.chips[i2][j2] = CORNERS.chips[i1][j1];
		CORNERS.chips[i1][j1] = 0;

		//проверка на завершение игры
		if (check_complete())
		{
			print_info_of_game();
		}
		else
		{
			if (CORNERS.player_move == 1)
			{
				CORNERS.player_move = (-1);
			}
			else
			{
				CORNERS.player_move = 1;
			}

			provision_of_trevel();
			print_info_of_game();
		}
	}
}



// проверяет, закончить игру или нет...
// в случаи завершения игры возвращает true, иначе false
// 1 - победили черные, 2 - белые, 3 - ничья == CORNERS.end

function check_complete()
{
	if (CORNERS.player_move != 1)
	{
		var flag_w = 1;
		var flag_b = 1;

		for (var i = 0; i < 8; i++)
		{
			for (var j = 0; j < 8; j++)
			{
				if (CORNERS.goal_game[i][j] > 0)
				{
					if (CORNERS.chips[i][j] <= 0)
					{
						flag_w = 0;
					}
				}

				if (CORNERS.goal_game[i][j] < 0)
				{
					if ((CORNERS.chips[i][j] >= 0))
					{
						flag_b = 0;
					}
				}
			}
		}

		if (flag_b == 1 || flag_w == 1)
		{
			if (flag_b == 1 && flag_w == 1)
			{
				CORNERS.end = 3;
				return true;
			}
			else
			{
				if (flag_b == 1)
				{
					CORNERS.end = 1;
					return true;
				}
				else
				{
					CORNERS.end = 2;
					return true;
				}
			}
		}
		else
		{
			return false;
		}
	}
	else
	{
		return false;
	}
}



// отображает клетки, при выделении фишки. Клетку с фишкой и сами возможные ходы

function visibliti_chips_focus(id, i_chips, j_chips)
{
	var div;

	for (var i = 0; i < 8; i++)
	{
		for (var j = 0; j < 8; j++)
		{
			div = document.getElementById("idCell" + i + j);
			div.style.display = "none";
		}
	}

	div = document.getElementById(id);
	div.style.display = "block";
	div.style.border = "5px solid #F00";
	CORNERS.focus.open_moves = CORNERS.open_moves[i_chips][j_chips]; 
	
	for (var count = 0; count < CORNERS.focus.open_moves.length; count++)
	{
		div = document.getElementById("idCell" + CORNERS.focus.open_moves[count][0] +
		 CORNERS.focus.open_moves[count][1]);
		div.style.display = "block";
		div.style.border = "5px solid #00F";
	}
}



// ход моего алгоритма №1

function moves_AI_1()
{
	if (CORNERS.end == 0)
	{
		var goal = new Array(2);
		var computed_moves = new Array(0);
		var i_j_cell = new Array(2);
		var l;
		var summ;
		var result = new Array(4);

		// растановка дополнительных пераметров, исходя из игрока
		if (CORNERS.player_move == 1)
		{
			var max = 100;
			var min = 0;
		}
		else
		{
			var max = 0;
			var min = -100;
		}

		// фишки, которые заняли свои позиции, исключить из расчета
		if (CORNERS.goal_game[0][0] == CORNERS.player_move)
		{
			outer:

			for (var i = 0; i < 8; i++)
			{
				for (var j = 0; j < 8; j++)
				{
					if ( min < CORNERS.chips[i][j] && CORNERS.chips[i][j] < max)
					{
						CORNERS.open_moves[i][j] = 0;
					}	
					else
					{
						break outer;
					}
				}
			}

			goal[0] = 0;
			goal[1] = 0;
		}
		else
		{
			outer_2:

			for (var i = 7; i >= 0; i--)
			{
				for (var j = 7; j >= 0; j--)
				{
					if ( min < CORNERS.chips[i][j] && CORNERS.chips[i][j] < max)
					{	
						CORNERS.open_moves[i][j] = 0;	
					}	
					else
					{	
						break outer_2;
					}
				}
			}

			goal[0] = 7;
			goal[1] = 7;
		}

		// собственно сам поиск наилучшего хода по двум параметрам

		for (var i = 0; i < 8; i++)
		{
			for (var j = 0; j < 8; j++)
			{
				if (CORNERS.open_moves[i][j] != 0)
				{
					computed_moves[computed_moves.length] = new Array(5); 
					l = 100;

					for (count = 0; count < CORNERS.open_moves[i][j].length; count++)
					{
						// если фишка может занять угловую позицию, то занять
						if (CORNERS.open_moves[i][j][count][0] == goal[0] && CORNERS.open_moves[i][j][count][1] == goal[1])
						{
							l = -100;
							i_j_cell[0] = CORNERS.open_moves[i][j][count][0];
							i_j_cell[1] = CORNERS.open_moves[i][j][count][1];	
						}
						else
						{
							if (colculation_s_l(CORNERS.open_moves[i][j][count][0],CORNERS.open_moves[i][j][count][1], goal) < l)
							{	
								l = colculation_s_l(CORNERS.open_moves[i][j][count][0],CORNERS.open_moves[i][j][count][1],goal);
								
								// ходы, которые введут в угол(цели), получают приоритет
								// защита от "боковых замыканий"
								if (CORNERS.goal_game[CORNERS.open_moves[i][j][count][0]][CORNERS.open_moves[i][j][count][1]] == CORNERS.player_move)
								{
									l -= 1;
								}

								i_j_cell[0] = CORNERS.open_moves[i][j][count][0];
								i_j_cell[1] = CORNERS.open_moves[i][j][count][1];
							}
						}
					}

					// подсчет рез-го параметра и устоновка значений ходов
					computed_moves[computed_moves.length - 1][0] = (100 - l) + colculation_s_l(i, j, goal);
					computed_moves[computed_moves.length - 1][1] = i;
					computed_moves[computed_moves.length - 1][2] = j;
					computed_moves[computed_moves.length - 1][3] = i_j_cell[0];
					computed_moves[computed_moves.length - 1][4] = i_j_cell[1];
				}
			}
		}

		// выбор наилучшего хода
		summ = 0;

		for (var count = 0; count < computed_moves.length; count++)
		{
			if (computed_moves[count][0] > summ)
			{
				summ = computed_moves[count][0];
				result[0] = computed_moves[count][1];
				result[1] = computed_moves[count][2];
				result[2] = computed_moves[count][3];
				result[3] = computed_moves[count][4];
			}
		}

		// выделение фишки
		click_cell("idCell" + result[0] + result[1], result[0], result[1]);
		// ход алгоритма
		click_cell("idCell" + result[0] + result[1], result[2], result[3]);
	}



	// Функция, которая расцитывает параметры для сравнения ходов
	// parameter = 1 - длина хода, parameter = 2 - расстояние от "цели"

	function colculation_s_l(i, j, goal)
	{
		if (i <= goal[0] && j < goal[1])
		{
			return  (goal[0] - i) + (goal[1] - j);
		}

		if (i < goal[0] && j >= goal[1])
		{
			return  (goal[0] - i) + (j - goal[1]);
		}

		if (i >= goal[0] && j > goal[1])
		{
			return  (i - goal[0]) + (j - goal[1]);
		}

		if (i > goal[0] && j <= goal[1])
		{
			return   (i - goal[0]) + (goal[1] - j);
		}
	}
}



// функиция для устоновления размеров элементов(поля, инфо окна и панели управления)

function resizeWindow()
{
	if (window.innerHeight > 400)
	{
		var heightInner = window.innerHeight;
	}
	else
	{
		var heightInner = 400;
	}

	if (window.innerWidth > 670 )
	{
		var widthInner = window.innerWidth;
	}
	else
	{
		var widthInner = 670;
	}

	var topDivField;
	var	leftDivField;
	var amendment = 20;
	var border = 10 * 2;

	if ((widthInner - 270) <= heightInner)
	{
		CORNERS.w = widthInner - 270 - border - amendment;
		topDivField = (heightInner - CORNERS.w - amendment)/2;
		leftDivField = 0;
	}
	else
	{
		CORNERS.w = heightInner - amendment - border;
		topDivField = 0;
		leftDivField = (widthInner - CORNERS.w - 270 - amendment)/2;
	}

	CORNERS.l = CORNERS.w;
	CORNERS.divField.style.width = CORNERS.w + "px";
	CORNERS.divField.style.height = CORNERS.w + "px";
	CORNERS.divField.style.top = topDivField + "px";
	CORNERS.divField.style.left = leftDivField + "px";
	CORNERS.divPrint.style.height = CORNERS.w + border - 300 - 60 + "px";
	CORNERS.divPrint.style.top = topDivField + "px";
	CORNERS.divPrint.style.left = CORNERS.w + leftDivField + border + "px";
	CORNERS.divControl.style.left = CORNERS.w + leftDivField + border +  "px";
	CORNERS.divControl.style.top = topDivField + CORNERS.w + border - 300 - 20 + "px";	
}



// создание всплывающих сообщений
// @param: type(int) - тип сообщения(1 - просто сообщение с кнопкой ok, 2 - сообщение, которое может принять текст)
//			message(string) - сообщение, которое выведится на "окне"

function createMessage(type, message)
{
	if (CORNERS.divMessage !== null) 
	{
		document.body.removeChild(CORNERS.divMessage);
	}

	var bodyHeight = window.innerHeight;
	var bodyWidth = window.innerWidth;
	CORNERS.divMessage = document.createElement("div");
	document.body.appendChild(CORNERS.divMessage);
	CORNERS.divMessage.style.width = 300 + 'px';
	CORNERS.divMessage.style.height = 100 + 'px';
	CORNERS.divMessage.style.backgroundColor = '#555';
	CORNERS.divMessage.style.color = "#FFF";
	CORNERS.divMessage.style.fontSize = "12pt";
	CORNERS.divMessage.style.position = 'absolute';
	CORNERS.divMessage.style.left = (bodyWidth - 300)/2 + 'px';
	CORNERS.divMessage.style.top = (bodyHeight - 100)/2 + 'px';
	CORNERS.divMessage.style.textAlign = 'center';
	CORNERS.divMessage.style.padding = '10px';
	CORNERS.divMessage.style.zIndex = '10';
	
	if (type == 1)
	{
		CORNERS.divMessage.innerHTML = 'Вы создали игру под номером: <B>' + message + '</B><BR> Теперь, для игры с другом, отправьте ему этот номер <BR>';
		CORNERS.divMessage.innerHTML += '<INPUT type = "button" id = "divMessageButton" value = "ok">';

		document.getElementById("divMessageButton").onclick = function() 
		{
			CORNERS.divPrint.innerHTML = 'Ожидание подключения ИГРОКА за черных';
			CORNERS.statusThisPlayer = 2;
			CORNERS.noGame = message;
			document.body.removeChild(CORNERS.divMessage);
			CORNERS.divMessage = null;
			watingOtherUser();
		}
	}
	else
	{
		CORNERS.divMessage.innerHTML = 'Введите в текстовое поле номер игры, к которой хотите подключиться <BR>';
		CORNERS.divMessage.innerHTML += '<INPUT type = "text"id = "divMessageBox" value = ""><BR>';
		CORNERS.divMessage.innerHTML += '<INPUT type = "Button" id = "divMessageButton" value = "ok">';
		CORNERS.divMessage.innerHTML += '<INPUT type = "button" id = "divMessageCancel" value = "cancel">';
		document.getElementById("divMessageBox").focus();

		document.getElementById("divMessageButton").onclick = function() 
		{
			var messageBox = document.getElementById("divMessageBox");
			
			if (messageBox.value.length > 0)
			{
				$.ajax(
				{
					url: "ajax.php",
					type: "GET",
					dataType: "json",
					data: 
					{
						connect_game: 1,
						player: CORNERS.thisPlayer,
						no_game: messageBox.value 
					},
					success: function(data)
							{
								if (data.statusGame == 2 && data.otherPlayer == 2)
								{
									document.body.removeChild(CORNERS.divMessage);
									CORNERS.divMessage = null;
									CORNERS.divPrint.innerHTML = "Игра подключена. ХОДИТ 'удалённый' ИГРОК за БЕЛЫХ";
									CORNERS.statusThisPlayer = 2;
									CORNERS.noGame = data.noGame;
									provision_of_trevel();
								}
								else
								{
									CORNERS.divPrint.innerHTML = "Что-то не так... С сервера пришли некоректные данные!";
								}
							},		
					error: function()
							{
								CORNERS.divPrint.innerHTML = "Ошибка соединения с сервером!"
							}		
				});
			}
		}

		document.getElementById("divMessageCancel").onclick = function()
		{
			if (CORNERS.divMessage !== null)
			{
				document.body.removeChild(CORNERS.divMessage);
				CORNERS.divMessage = null;
			}
		}
	}
}



// ожидание подключения игрока по номеру
function watingOtherUser()
{
	function watingConnectBlack()
	{
		$.ajax(
		{
			url: "ajax.php",
			type: "GET",
			dataType: "json",

			data: 
			{
				get_info: 1,
				no_game: CORNERS.noGame,
				player: CORNERS.thisPlayer
			},

			success: function(data)
			{
				if (data.statusGame !== false)
				{
					if (data.statusGame == 2 && data.otherPlayer == 2)
					{
						clearInterval(CORNERS.intervalID);
						CORNERS.divPrint.innerHTML = '"Удаленный" ИГРОК за ЧЕРНЫХ подключился. Делай свой ХОД ИГРОК за БЕЛЫХ';
						provision_of_trevel();
					}
				}
				else
				{
					clearInterval(CORNERS.intervalID);
					CORNERS.divPrint.innerHTML = 'Ошибка игры, такой инры нет! Игра остановлена.';
				}
			},

			error: function()
			{
				clearInterval(CORNERS.intervalID);
				CORNERS.divPrint.innerHTML = 'Ошибка соединения! Игра остановлена';
			}
		});
	}

	CORNERS.intervalID = setInterval(watingConnectBlack, CORNERS.setTime);
} 

// функция, которая реализовывает ход игрока через сеть
function moveUserToNetwork()
{
	function watingMove()
	{
		$.ajax(
		{
			url: "ajax.php",
			type: "GET",
			dataType: "json",

			data: 
			{
				get_info: 1,
				no_game: CORNERS.noGame,
				player: CORNERS.thisPlayer
			},

			success: function(data)
			{
				if (data.statusGame !== false)
				{
					if (data.statusGame == 2)
					{
						if (data.otherPlayer == 2)
						{
							clearInterval(CORNERS.intervalID);
							var i1j1i2j2 = data.lastMove.split("_");
							var i1 = 7 - i1j1i2j2['0'].charAt(0);
							var j1 = 7 - i1j1i2j2['0'].charAt(1);
							var i2 = 7 - i1j1i2j2['1'].charAt(0);
							var	j2 = 7 - i1j1i2j2['1'].charAt(1);
							moving_chips(i1, j1, i2, j2);
						}
					}
					else
					{
						clearInterval(CORNERS.intervalID);
						CORNERS.divPrint.innerHTML = 'С сервера пришли некоректные данные! Извините, но данная игра остановлена.';
					}
				}
				else
				{
					clearInterval(CORNERS.intervalID);
					CORNERS.divPrint.innerHTML = 'Ошибка игры, такой инры нет! Игра остановлена.';
				}
			},

			error: function()
			{
				clearInterval(CORNERS.intervalID);
				CORNERS.divPrint.innerHTML = 'Ошибка соединения! Игра остановлена';
			}
		});
	}

	CORNERS.intervalID = setInterval(watingMove, CORNERS.setTime);
}



// после указания хода, скрыть обозначения фишек
// @param: i_chips(int) - параматр i фишки, j_chips(int) - параметр j фишки  

function hidden_selection_of_chips(i_chips, j_chips)
{
	var length = CORNERS.open_moves[i_chips][j_chips].length;

	for (var count = 0; count < length; count++)
	{
		document.getElementById("idCell" + CORNERS.open_moves[i_chips][j_chips][count][0] + CORNERS.open_moves[i_chips][j_chips][count][1]).style.display = "none";
	}

	document.getElementById("idCell" + i_chips + j_chips).style.display = "none";
}
<?php

	$CFG = new stdClass;
	// название хоста
	$CFG->host = 'mysql.hostinger.ru';

	// пользователь БД
	$CFG->user = 'u470596904_user';

	// пароль к БД
	$CFG->password = '521442132';

	// название датабазы
	$CFG->database = 'u470596904_bd';

	// максимальная продолжительность одного хода
	$CFG->max_set_time = 1200; 

	$link_bd = connect_bd();

	$text = '';

	// запрос на создание игры
	if (isset($_GET['start_game']) && isset($_GET['player']))
	{
		// удаление  игр,  у которых истек лимит хода
		delete_games($CFG->max_set_time, time());
		
		if ($no_game = new_game($_GET['player']))
		{
			$text = '{ "noGame": '.$no_game.'}';
		}
		else
		{
			$text = '{ "noGame": false}';
		}
	}

	// ход игрока и получение результата
	if (isset($_GET['go_move']))
	{
		if(isset($_GET['move']) && isset($_GET['no_game']) && isset($_GET['player']))
		{
			$answer = array();
			$answer = go_move($_GET['no_game'], $_GET['move'],  $_GET['player']);
			$text = '{ "statusGame": "'.$answer['status_game'].'", "otherPlayer": "'.$answer['other_player'].'", "lastMove": "'.$answer['last_move'].'"}';
		}
	}

	// получение информации о состоянии игры
	if (isset($_GET['get_info']))
	{
		if (isset($_GET['no_game']) && isset($_GET['player']))
		{
			$answer = array();
			$answer = get_info_of_game($_GET['no_game'], $_GET['player']);
            $text = '{ "statusGame": "'.$answer['status_game'].'", "otherPlayer": "'.$answer['other_player'].'", "lastMove": "'.$answer['last_move'].'"}';		}
	}

	// запрос на подключение к игре
	if (isset($_GET['connect_game']))
	{
		if (isset($_GET['no_game']) && isset($_GET['player']))
		{
			$answer = array();
			$answer = connect_game($_GET['no_game'], $_GET['player']);
         	$text = '{ "statusGame": "'.$answer['status_game'].'", "otherPlayer": "'.$answer['other_player'].'", "noGame": "'.$answer['no_game'].'"}';		}
	}


	print($text);
	close_connected($link_bd);

	// подключается к БД
	function connect_bd()
	{ 
		global $CFG;
		 $link = mysql_connect($CFG->host, $CFG->user, $CFG->password)
		     or die("Failed to connect: ".mysql_error());
		 mysql_select_db($CFG->database)
		     or die("Failed to choose db: ".mysql_error());
		 return $link;	
	}

	// закрывает данное соединение
	// @param: $link - содержит ссылку на соединение

	function close_connected($link)
	{
		if (isset($link))
		mysql_close($link);
	}



	// создает новую игру
	// @param: $player(int) - 1 - создает белый игрок, 2 - создает ченый игрок
	// @return: $id or false - $id - в случае успешной операции создания игры, false - иначе

	function new_game($player)
	{
		$query = "SELECT count(id) AS num FROM games";
		$rs = mysql_query($query) or die('Error SELECT count in new_game: '.mysql_error().'<BR> text_select: '.$query.'<BR>');
		$row = mysql_fetch_array($rs);
		mysql_free_result($rs);

		if ($row['num'] <= 100)
		{
			$date = time();

			if ($player == 1)
			{
				$query1 = "INSERT INTO games (status_game, status_wite, status_black, date_action)
							 VALUES (1, 2, 0, ".$date.")";
			}
			else
			{
					$query1 = "INSERT INTO games (status_game, status_wite, status_black, date_action)
							 VALUES (1, 0, 2, ".$date.")";
			}

			mysql_query($query1) or die('Error INSERT INTO in new_game: '.mysql_error().'<BR> text_select: '.$query1.'<BR>');
			$id = mysql_insert_id();
			return $id;
		}
		else
		{
			return false;
		}
	}



	// удаляет игры, у которых истек лимит хода
	// @param: $limit(int) - лимит времени хода
	//			$date(int) - текущая время(unix формат)

	function delete_games($limit, $date)
	{
		$query = "SELECT id FROM games WHERE (".$date." - date_action) > ".$limit;
		$rs = mysql_query($query) or die('Error SELECT id in delet_games: '.mysql_error().'<BR> select_text: '.$query.'<BR>');

		while ($row = mysql_fetch_array($rs, MYSQL_ASSOC))
		{
			$query1 = "DELETE FROM games WHERE id = ".$row['id'];
			mysql_query($query1) or die('Error DELETE FROM in delete_games: '.mysql_error().'<BR> text_select: '.$query1.'<BR>');
		} 

		mysql_free_result($rs);
	}



	// ход игрока
	// @param: $no_game(int) - номер игры,
	//			$move(string) - ход игрока,
	//			$player(int) - обозначение игрока, который ходит. 1 - белые, 2 - черные;
	// @return: $result(array) - ответ сервера.
	//			$result['status_game'](boolean or int) - статус игры: 1 - неактивная игра,
	//												2 - активная игра, 3 - завершённая игра, false - такой игры нет
	//			$result['other_player'](int) - статус другого игрока. 0 - неактивен, 1 - активен, 2 - игрок в статусе ожидания
	//			$result['last_move'](char) - последний ход в игре

	function go_move($no_game, $move, $player)
	{
		$result = array();

		if ($player == 1)
		{
			$query = "SELECT id  FROM games WHERE  (id = ".$no_game.") and (status_game = 2) and (status_black = 2)";
		}
		else
		{
			$query = "SELECT id FROM games WHERE  (id = ".$no_game.") and (status_game = 2) and (status_wite = 2)";
		}

		$rs = mysql_query($query) or die('Error SELECT id in go_move: '.mysql_error().'<BR> text of select: '.$query.'<BR>');
		$row = mysql_fetch_array($rs);
		mysql_free_result($rs);

		if(isset($row['id']))
		{
			if ($player == 1)
			{
				$query1 = "UPDATE games SET status_wite = 2, status_black = 1, last_move = '".$move."'";
			}
			else
			{
				$query1 = "UPDATE games SET status_black = 2, status_wite = 1, last_move = '".$move."'";
			}

			mysql_query($query1) or die('Error UPDATE games in go_move: '.mysql_error().'<BR> text of select: '.$query1.'<BR>');
			$result['status_game'] = 2;
			$result['other_player'] = 1;
			$result['last_move'] = $move;
		}
		else
		{
			$result['status_game'] = false;
			$result['other_player'] = NULL;
			$result['last_move'] = NULL;
		}

		return $result;
	}



	// получение информации о состоянии игры
	// @param: $no_game(int) - номер игры,
	//			$player(int) - обозначение игрока, который ходит. 1 - белые, 2 - черные;
	// @return: $result(array) - ответ сервера.
	//			$result['status_game'](boolean or int) - статус игры: 1 - неактивная игра,
	//												2 - активная игра, 3 - завершённая игра, false - такой игры нет
	//			$result['other_player'](int) - статус другого игрока. 0 - неактивен, 1 - активен, 2 - игрок в статусе ожидания
	//			$result['last_move'](char) - последний ход в игре

	function get_info_of_game($no_game, $player)
	{
		$result = array();

		if ($player == 1)
		{
			$query = "SELECT status_game, status_black AS other_player, last_move FROM games WHERE id = ".$no_game;
		}
		else
		{
			$query = "SELECT status_game, status_wite AS other_player, last_move FROM games WHERE id = ".$no_game;
		}

		$rs = mysql_query($query) or die('Error SELECT in get_info_of_game: '.mysql_error().'<BR> text of select: '.$query.'<BR>');
		$row = mysql_fetch_array($rs);
		mysql_free_result($rs);

		if(isset($row['status_game']))
		{
			$result['status_game'] = $row['status_game'];
			$result['other_player'] = $row['other_player'];
			$result['last_move'] = $row['last_move'];
		}
		else
		{
			$result['status_game'] = false;
			$result['other_player'] = NULL;
			$result['last_move'] = NULL;
		}

		return $result;  
	}



	// запрос на подключение к игре
	// @param: $no_game(int) - номер игры
	//         $player(int) = игрок, 1 - белые, 2 - черные
	// @return: $result(array) - ответ сервера.
	//			$result['status_game'](boolean or int) - статус игры: 1 - неактивная игра,
	//												2 - активная игра, 3 - завершённая игра, false - такой игры нет
	//			$result['other_player'](int) - статус другого игрока. 0 - неактивен, 1 - активен, 2 - игрок в статусе ожидания
	//			$result['no_game'](int) - 


	function connect_game($no_game, $player)
	{
		$result = array();

		if ($player == 1)
		{
			$query = "SELECT id FROM games WHERE (id = ".$no_game.") and (status_black = 2) and (status_game = 1)"; 
		}
		else
		{
			$query = "SELECT id FROM games WHERE (id = ".$no_game.") and (status_wite = 2) and (status_game = 1)"; 
		} 

		$rs = mysql_query($query) or die('Error SELECT id in connect_game: '.mysql_error().'<BR> text of select: '.$query.'<BR>');
		$row = mysql_fetch_array($rs);
		mysql_free_result($rs);

		if (isset($row['id']))
		{
			$date = time();

			if ($player == 1)
			{
				$query1 = "UPDATE games SET status_game = 2, status_wite = 2, status_black = 1, date_action = ".$date;
			}
			else
			{
				$query1 = "UPDATE games SET status_game = 2, status_black = 2, status_wite = 1, date_action = ".$date;
			}

			mysql_query($query1) or die('Error UPDATE games in connect_game: '.mysql_error().'<BR> text of select: '.$query1.'<BR>');

			$result['status_game'] = 2;
			$result['other_player'] = 2 ;
			$result['no_game'] = $row['id'];
		}
		else
		{
			$result['status_game'] = false;
			$result['other_player'] = NULL;
			$result['no_game'] = NULL;	
		}

		return $result;
	}
?>
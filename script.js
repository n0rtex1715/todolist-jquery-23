// .ready() -> срабатывает только при полной загрузке страницы
$(document).ready(function () {
    // Инициализируем задачи из localstorage, если они имеются
    let tasks = loadTasks();

    // Обработчик события для добавления задачи (по клику)
    $('#addTaskBtn').on('click', function () {
        // Получаем название задачи из поля ввода
        let taskName = $('#taskInput').val();
        // Проверяем, если строка ввода не пустая
        if (taskName.trim() !== '') {
            // Добавляем задачу в список
            addTask(taskName);
            // Очищаем поле ввода
            $('#taskInput').val('');
            // Сохраняем задачу в localstorage
            saveTasks();
        }
    });

    // Обработчик события для смены фильтра по статусу
    $('#statusFilter').on('change', function () {
        // Обновляем ("фильтруем") список задач на основе выбранного (статуса)
        updateTaskList($(this).val());
    });

    // Ф: Добавление новой задачи в список
    function addTask(taskName) {
        // Создаем объект "новаяЗадача"
        let newTask = {
            id: new Date().getTime(), // Генерируем уникальный id исходя из текущего времени
            name: taskName,
            completed: false,
            trashed: false,
        };
        // Добавляем в список задач
        tasks.push(newTask);
        // Обновляем отображение списка задач в UI
        updateTaskList();
    }

    // Ф: Обновление списка задач в UI
    function updateTaskList(statusFilter = 'all') { // По умолчанию стоит по статусу "all"
        // Очищаем список задач
        $('#taskList').empty();

        // Фильтруем задачи по выбранному статусу
        let filteredTasks = tasks;
        // По активным задачам (не выполненные и не в корзине)
        if (statusFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed && !task.trashed);
        }
        // По выполненным задачам (выполненные и не в корзине)
        else if (statusFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed && !task.trashed);
        }
        // Находящиеся в корзине (проверяем только если в корзине) 
        else if (statusFilter === 'trash') {
            filteredTasks = tasks.filter(task => task.trashed);
        }

        // Выводим список задач в UI
        filteredTasks.forEach(task => {
            // Добавляем новый элемент <li> под отображение задачи
            let listItem = $('<li class="list-group-item"></li>');
            // С помощью функции getAlertClass() вставляем нужный Bootstrap стиль для alert (см. функцию)
            listItem.append(`<div class="task-name alert ${getAlertClass(task)}">${task.name}</div>`);

            // Блок с кнопками
            let actionButtons = $('<div class="float-end"></div>');

            // Кнопка для отметки задачи как выполненной или удаления
            let completeButton = $('<button class="btn btn-sm"></button>');
            
            // Если задача находится в корзине,
            if (task.trashed) {
                // показываем кнопку для удаления
                completeButton.append('<i class="bi bi-trash text-danger"></i>');
                // И добавляем обработчик события на удаление задачи
                completeButton.on('click', function () {
                    removeTask(task.id);
                });
            } else {
                // Иначе, показываем кнопку для обозначения задачи как завершенной / активной
                completeButton.append(task.completed
                    ? '<i class="bi bi-check-circle-fill text-success"></i>'
                    : '<i class="bi bi-check-circle text-warning"></i>'
                );
                // Обработчик на смену статуса
                completeButton.on('click', function () {
                    toggleTaskStatus(task.id);
                });
            }

            // Кнопка для добавления в корзину / полного удаления
            let trashButton = $('<button class="btn btn-sm"></button>');
            // Вывод соответствующей иконки
            trashButton.append(task.trashed
                ? '<i class="bi bi-arrow-counterclockwise" text-primary"></i>'
                : '<i class="bi bi-archive-fill text-secondary"></i>'
            );
            // Обработчик на смену статуса
            trashButton.on('click', function () {
                toggleTaskTrash(task.id);
            });

            // Кнопка для переименовывания
            let renameButton = $('<button class="btn btn-sm btn-info ms-2"></button>');
            renameButton.append('<i class="bi bi-pencil"></i>');
            renameButton.on('click', function () {
                let newName = prompt('Введите новое название:', task.name);
                if (newName !== null) {
                    renameTask(task.id, newName);
                }
            });

            // Добавляем функциональные кнопки к задаче
            actionButtons.append(completeButton);
            actionButtons.append(trashButton);
            actionButtons.append(renameButton);

            listItem.append(actionButtons);

            $('#taskList').append(listItem);
        });
    }

    // Ф: Смена стиля рамки задачи в зависимости от статуса задачи
    function getAlertClass(task) {
        if (task.completed) {
            return 'alert-success';
        } else if (task.trashed) {
            return 'alert-secondary';
        } else {
            return 'alert-warning';
        }
    }

    // Ф: Смена статуса задачи на выполненную / добавление в корзину
    function toggleTaskStatus(taskId) {
        let taskIndex = tasks.findIndex(task => task.id === taskId)
        // Проверяем, если задача не находится в корзине
        if (taskIndex !== -1 && !tasks[taskIndex].trashed) {
            // Унарно меняем статус задачи (false != true)
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            // Обновляем список в UI
            updateTaskList();
            // Сохраняем задачи в localstorage
            saveTasks();
        }
    }

    // Ф: Перемещение задачи в корзину / ввостановление
    function toggleTaskTrash(taskId) {
        let taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            // Унарно меняем статус "корзины"
            tasks[taskIndex].trashed = !tasks[taskIndex].trashed;

            // При ввостановлении задачи из корзины,
            if (tasks[taskIndex].trashed) {
                // помечаем статус задачи как "активный"
                tasks[taskIndex].completed = false;
            }

            // Обновляем список в UI
            updateTaskList();
            // Сохраняем задачи в localstorage
            saveTasks();
        }
    }

    // Ф: Полное удаление задачи из корзины
    function removeTask(taskId) {
        // Обновляем список задач через .filter() по ID задачи, которую хотим удалить
        tasks = tasks.filter(task => task.id !== taskId);
        // Обновляем список в UI
        updateTaskList();
        // Сохраняем задачи в localstorage
        saveTasks();
    }

    // Ф: Переименовываем название задачи
    function renameTask(taskId, newName) {
        let taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].name = newName;
            // Update the task list on the UI
            updateTaskList();
            // Save tasks to local storage
            saveTasks();
        }
    }

    // Ф: Сохранение задаx в локальном хранилище бразуреа в JSON формате
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Ф: Загрузка задач из локального хранилища путем парса JSON предмета
    function loadTasks() {
        let savedTasks = localStorage.getItem('tasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    }

    // Загрузка задач из списка происходит при полной загрузке страницы
    // Обновляем для имеющегося списка задач
    updateTaskList();
});
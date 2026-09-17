<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectMemberController;
use App\Http\Controllers\ProjectTemplateController;
use App\Http\Controllers\TaskChecklistItemController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskStatusController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /* --------------------------------- projects -------------------------------- */

    Route::resource('projects', ProjectController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);

    // Board layout is persisted in bulk after a drag settles.
    Route::put('projects/{project}/tasks/reorder', [TaskStatusController::class, 'reorder'])
        ->name('projects.tasks.reorder');

    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store'])
        ->name('projects.members.store');
    Route::delete('projects/{project}/members/{user}', [ProjectMemberController::class, 'destroy'])
        ->name('projects.members.destroy');

    /* ---------------------------------- tasks ---------------------------------- */

    Route::resource('tasks', TaskController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::put('tasks/{task}/status', [TaskStatusController::class, 'update'])
        ->name('tasks.status.update');

    Route::post('tasks/{task}/comments', [TaskCommentController::class, 'store'])
        ->name('tasks.comments.store');
    Route::put('tasks/{task}/comments/{comment}', [TaskCommentController::class, 'update'])
        ->name('tasks.comments.update');
    Route::delete('tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])
        ->name('tasks.comments.destroy');

    Route::post('tasks/{task}/checklist', [TaskChecklistItemController::class, 'store'])
        ->name('tasks.checklist.store');
    Route::put('tasks/{task}/checklist/{item}', [TaskChecklistItemController::class, 'update'])
        ->name('tasks.checklist.update');
    Route::delete('tasks/{task}/checklist/{item}', [TaskChecklistItemController::class, 'destroy'])
        ->name('tasks.checklist.destroy');

    /* -------------------------- clients & templates ---------------------------- */

    Route::resource('clients', ClientController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);

    Route::resource('project-templates', ProjectTemplateController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->parameters(['project-templates' => 'project_template']);

    /* ------------------------------ notifications ------------------------------ */

    Route::put('notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('notifications.read-all');
    Route::put('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->name('notifications.read');
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy'])
        ->name('notifications.destroy');
});

require __DIR__.'/settings.php';

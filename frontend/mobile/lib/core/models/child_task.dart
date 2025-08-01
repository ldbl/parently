import 'package:json_annotation/json_annotation.dart';

part 'child_task.g.dart';

@JsonSerializable()
class ChildTask {
  final String id;
  @JsonKey(name: 'userId')
  final String userId;
  final String title;
  final String? description;
  @JsonKey(name: 'taskType')
  final String taskType;
  final int points;
  final bool completed;
  @JsonKey(name: 'completedAt')
  final String? completedAt;
  @JsonKey(name: 'createdAt')
  final String createdAt;

  const ChildTask({
    required this.id,
    required this.userId,
    required this.title,
    this.description,
    required this.taskType,
    required this.points,
    required this.completed,
    this.completedAt,
    required this.createdAt,
  });

  bool get isHomework => taskType == 'homework';
  bool get isSocial => taskType == 'social';
  bool get isFinancial => taskType == 'financial';

  factory ChildTask.fromJson(Map<String, dynamic> json) => _$ChildTaskFromJson(json);
  Map<String, dynamic> toJson() => _$ChildTaskToJson(this);

  ChildTask copyWith({
    String? id,
    String? userId,
    String? title,
    String? description,
    String? taskType,
    int? points,
    bool? completed,
    String? completedAt,
    String? createdAt,
  }) {
    return ChildTask(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      description: description ?? this.description,
      taskType: taskType ?? this.taskType,
      points: points ?? this.points,
      completed: completed ?? this.completed,
      completedAt: completedAt ?? this.completedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'ChildTask(id: $id, title: $title, taskType: $taskType, completed: $completed)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ChildTask && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 
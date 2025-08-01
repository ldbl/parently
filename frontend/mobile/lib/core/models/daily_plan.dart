import 'package:json_annotation/json_annotation.dart';

part 'daily_plan.g.dart';

@JsonSerializable()
class DailyPlan {
  final String id;
  @JsonKey(name: 'userId')
  final String userId;
  @JsonKey(name: 'planContent')
  final String planContent;
  @JsonKey(name: 'planDate')
  final String planDate;
  @JsonKey(name: 'createdAt')
  final String createdAt;

  const DailyPlan({
    required this.id,
    required this.userId,
    required this.planContent,
    required this.planDate,
    required this.createdAt,
  });

  factory DailyPlan.fromJson(Map<String, dynamic> json) => _$DailyPlanFromJson(json);
  Map<String, dynamic> toJson() => _$DailyPlanToJson(this);

  // Parse plan content to get structured data
  Map<String, dynamic> get parsedContent {
    try {
      return Map<String, dynamic>.from(planContent as Map);
    } catch (e) {
      return {
        'plan': planContent,
        'focusAreas': [],
        'tips': [],
      };
    }
  }

  String get plan => parsedContent['plan'] ?? planContent;
  List<String> get focusAreas => List<String>.from(parsedContent['focusAreas'] ?? []);
  List<String> get tips => List<String>.from(parsedContent['tips'] ?? []);

  DailyPlan copyWith({
    String? id,
    String? userId,
    String? planContent,
    String? planDate,
    String? createdAt,
  }) {
    return DailyPlan(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      planContent: planContent ?? this.planContent,
      planDate: planDate ?? this.planDate,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'DailyPlan(id: $id, planDate: $planDate)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is DailyPlan && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 
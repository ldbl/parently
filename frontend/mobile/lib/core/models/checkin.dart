import 'package:json_annotation/json_annotation.dart';

part 'checkin.g.dart';

@JsonSerializable()
class Checkin {
  final String id;
  @JsonKey(name: 'userId')
  final String userId;
  @JsonKey(name: 'checkinType')
  final String checkinType;
  @JsonKey(name: 'emotionalState')
  final int emotionalState;
  @JsonKey(name: 'financialStress')
  final int financialStress;
  final String? notes;
  @JsonKey(name: 'unexpectedExpenses')
  final double unexpectedExpenses;
  @JsonKey(name: 'createdAt')
  final String createdAt;

  const Checkin({
    required this.id,
    required this.userId,
    required this.checkinType,
    required this.emotionalState,
    required this.financialStress,
    this.notes,
    required this.unexpectedExpenses,
    required this.createdAt,
  });

  bool get isMorning => checkinType == 'morning';
  bool get isEvening => checkinType == 'evening';

  factory Checkin.fromJson(Map<String, dynamic> json) => _$CheckinFromJson(json);
  Map<String, dynamic> toJson() => _$CheckinToJson(this);

  Checkin copyWith({
    String? id,
    String? userId,
    String? checkinType,
    int? emotionalState,
    int? financialStress,
    String? notes,
    double? unexpectedExpenses,
    String? createdAt,
  }) {
    return Checkin(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      checkinType: checkinType ?? this.checkinType,
      emotionalState: emotionalState ?? this.emotionalState,
      financialStress: financialStress ?? this.financialStress,
      notes: notes ?? this.notes,
      unexpectedExpenses: unexpectedExpenses ?? this.unexpectedExpenses,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'Checkin(id: $id, checkinType: $checkinType, emotionalState: $emotionalState, financialStress: $financialStress)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Checkin && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 
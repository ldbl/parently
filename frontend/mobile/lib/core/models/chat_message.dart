import 'package:json_annotation/json_annotation.dart';

part 'chat_message.g.dart';

@JsonSerializable()
class ChatMessage {
  final String id;
  @JsonKey(name: 'userId')
  final String userId;
  final String message;
  final String response;
  @JsonKey(name: 'complexityScore')
  final int? complexityScore;
  @JsonKey(name: 'aiModel')
  final String aiModel;
  @JsonKey(name: 'createdAt')
  final String createdAt;

  const ChatMessage({
    required this.id,
    required this.userId,
    required this.message,
    required this.response,
    this.complexityScore,
    required this.aiModel,
    required this.createdAt,
  });

  bool get isHaiku => aiModel == 'haiku';
  bool get isSonnet => aiModel == 'sonnet';

  factory ChatMessage.fromJson(Map<String, dynamic> json) => _$ChatMessageFromJson(json);
  Map<String, dynamic> toJson() => _$ChatMessageToJson(this);

  ChatMessage copyWith({
    String? id,
    String? userId,
    String? message,
    String? response,
    int? complexityScore,
    String? aiModel,
    String? createdAt,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      message: message ?? this.message,
      response: response ?? this.response,
      complexityScore: complexityScore ?? this.complexityScore,
      aiModel: aiModel ?? this.aiModel,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  String toString() {
    return 'ChatMessage(id: $id, message: $message, aiModel: $aiModel)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is ChatMessage && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
} 
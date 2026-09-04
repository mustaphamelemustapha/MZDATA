import 'package:flutter/material.dart';

class AxisSpacing {
  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 40;
}

class AxisRadii {
  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double xxl = 24;
}

class AxisDurations {
  static const Duration fast = Duration(milliseconds: 120);
  static const Duration normal = Duration(milliseconds: 180);
  static const Duration slow = Duration(milliseconds: 260);
}

class AxisShadows {
  static const List<BoxShadow> softGlow = [
    BoxShadow(
      color: Color(0x0A000000),
      blurRadius: 12.0,
      offset: Offset(0, 4),
    ),
    BoxShadow(
      color: Color(0x05000000),
      blurRadius: 4.0,
      offset: Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> premiumGlow = [
    BoxShadow(
      color: Color(0x33CCFF00), // Harder, sharper lime glow
      blurRadius: 0.0, // Hard shadow
      offset: Offset(4, 4),
    ),
  ];
}

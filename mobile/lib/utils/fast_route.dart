import 'package:flutter/material.dart';

class FastRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  FastRoute({required this.page, super.settings})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionDuration: const Duration(milliseconds: 320),
          reverseTransitionDuration: const Duration(milliseconds: 280),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            // High-standard fintech spatial slide transition
            final inAnimation = CurvedAnimation(
              parent: animation,
              curve: Curves.fastOutSlowIn,
              reverseCurve: Curves.easeOutCubic,
            );

            // Subtle parallax for the underlying outgoing screen
            final secondaryAnimationCurved = CurvedAnimation(
              parent: secondaryAnimation,
              curve: Curves.fastOutSlowIn,
              reverseCurve: Curves.easeOutCubic,
            );

            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1.0, 0.0), // Full physical slide from right
                end: Offset.zero,
              ).animate(inAnimation),
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: Offset.zero,
                  end: const Offset(-0.18, 0.0), // Gentle parallax depth
                ).animate(secondaryAnimationCurved),
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 20,
                        offset: const Offset(-4, 0),
                      ),
                    ],
                  ),
                  child: child,
                ),
              ),
            );
          },
        );
}

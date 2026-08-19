declare module "react-notification-badge" {
  import type { CSSProperties, ComponentType } from "react";

  export const Effect: {
    ROTATE_X: unknown;
    ROTATE_Y: unknown;
    SCALE: unknown;
  };

  type NotificationBadgeProps = {
    count?: number;
    label?: string;
    containerStyle?: CSSProperties;
    style?: CSSProperties;
    className?: string;
    effect?: unknown;
    duration?: number;
  };

  const NotificationBadge: ComponentType<NotificationBadgeProps>;

  export default NotificationBadge;
}
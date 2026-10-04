import type { ComponentProps } from "solid-js";

import type { Badge } from "mdui/components/badge";
import type { CircularProgress } from "mdui/components/circular-progress";
import type { Fab } from "mdui/components/fab";
import type { List } from "mdui/components/list";
import type { ListItem } from "mdui/components/list-item";
import type { ListSubheader } from "mdui/components/list-subheader";
import type { NavigationRail } from "mdui/components/navigation-rail";
import type { NavigationRailItem } from "mdui/components/navigation-rail-item";
import type { SegmentedButton } from "mdui/components/segmented-button";
import type { SegmentedButtonGroup } from "mdui/components/segmented-button-group";
import type { Snackbar } from "mdui/components/snackbar";
import type { TextField } from "mdui/components/text-field";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "md-ripple": { disabled?: boolean };

      "mdui-circular-progress": ComponentProps<CircularProgress>;
      "mdui-fab": ComponentProps<Fab>;
      "mdui-segmented-button": ComponentProps<SegmentedButton>;
      "mdui-segmented-button-group": ComponentProps<SegmentedButtonGroup>;
      "mdui-badge": ComponentProps<Badge>;
      "mdui-navigation-rail": ComponentProps<NavigationRail>;
      "mdui-navigation-rail-item": ComponentProps<NavigationRailItem>;
      "mdui-list": ComponentProps<List>;
      "mdui-list-item": ComponentProps<ListItem>;
      "mdui-list-subheader": ComponentProps<ListSubheader>;
      "mdui-text-field": ComponentProps<TextField>;
      "mdui-snackbar": ComponentProps<Snackbar>;
    }
  }
}

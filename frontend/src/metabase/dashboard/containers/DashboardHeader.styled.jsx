import styled from "@emotion/styled";
import { color } from "metabase/lib/colors";

import Button from "metabase/core/components/Button";

export const DashboardHeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 6px;
  color: ${props => (props.isActive ? color("brand") : color("text-dark"))};
  background-color: ${props =>
    props.isActive ? color("brand-light") : "transparent"};
  transition: all 200ms;

  &:hover:enabled {
    cursor: pointer;
    color: ${props => (props.isActive ? color("white") : color("brand"))};
    background-color: ${props =>
      props.isActive ? color("brand") : "transparent"};
  }

  &:disabled {
    color: ${color("text-light")};
  }
`;

export const DashboardHeaderActionDivider = styled.div`
  height: 1.25rem;
  padding-left: 0.75rem;
  margin-left: 0.75rem;
  width: 0px;
  border-left: 1px solid ${color("border-dark")};
`;

export const DashboardHeaderInfoButton = styled(Button)`
  color: ${props =>
    props.isShowingDashboardInfoSidebar ? color("brand") : color("text-dark")};
`;

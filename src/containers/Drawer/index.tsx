import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { UnstyledButton, Paper, Text } from '@mantine/core';
import { useLocalStorageValue } from '@mantine/hooks';
import { ChevronsLeft, ChevronsRight } from 'react-feather';
import { useDrawerContext } from '../../contexts/drawer';
import Portal from '../../components/Portal';

interface Props {
  open?: boolean,
  onToggle?: (newState: boolean) => void,
  children: React.ReactNode,
}

const Drawer = (props: Props) => {
  const { open, onToggle, children } = props;
  const [tooltipDismissed, setTooltipDismissed] = useLocalStorageValue<'false' | 'true'>({ key: 'tooltip-dismissed', defaultValue: 'false' });
  const ctx = useDrawerContext();

  const showTooltip = tooltipDismissed === 'false';

  useEffect(() => {
    if (open) {
      setTooltipDismissed('true');
    }
  }, [open, setTooltipDismissed]);

  return (
    <Portal rootNode={ctx.rootNode}>
      <DrawerDimmer open={!!open} onClick={() => { onToggle?.(!open); }} />
      <DrawerContainer open={!!open}>
        <DrawerToggle onClick={() => { onToggle?.(!open); }}>
          <ToggleLabel>
            <ToggleLabelText>Control Panel</ToggleLabelText>
            <ToggleLabelIcon>
              {
                open
                  ? <ChevronsLeft />
                  : <ChevronsRight />
              }
            </ToggleLabelIcon>
          </ToggleLabel>
          {
            showTooltip && (
              <Tooltip>
                <TooltipText>
                  Click here to get started!
                </TooltipText>
                <TooltipConfirmContainer>
                  <TooltipConfirm onClick={(e) => { setTooltipDismissed('true'); e.stopPropagation(); }}>
                    Dismiss
                  </TooltipConfirm>
                </TooltipConfirmContainer>
              </Tooltip>
            )
          }
        </DrawerToggle>
        <DrawerContent aria-hidden={!open}>
          {children}
        </DrawerContent>
      </DrawerContainer>
    </Portal>
  )
};

export default Drawer;

const DrawerDimmer = styled.div<{ open: boolean }>`
  position: absolute;
  top: 0px;
  left: 0px;
  bottom: 0px;
  right: 0px;
  margin: 0;
  padding: 0;
  background: #000;
  opacity: ${({ open }) => open ? 0.7 : 0.0 };
  transition: opacity 550ms;
  pointer-events: ${({ open }) => open ? 'auto' : 'none' };
`;

const DrawerContainer = styled.div<{ open: boolean }>`
  position: relative;
  top: 0px;
  left: ${({ open, theme }) => (open ? '0px' : `-${theme.other.drawerWidth}`)};
  width: ${({ theme }) => theme.other.drawerWidth};
  height: 100%;
  background: ${({ theme }) => theme.colors.background[0]};
  transition: left 550ms;
  transition-timing-function: cubic-bezier(.68, -0.21, .38, 1.26);
  pointer-events: auto;
`;

const DrawerToggle = styled(UnstyledButton)`
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0px;
  bottom: 0px;
  right: -25px;
  width: 25px;
  background: ${({ theme }) => theme.colors.primary[7]};
`;

const ToggleLabel = styled(UnstyledButton)`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  right: -25px;
  width: 30px;
  height: 120px;
  border-radius: 2px;
  font-size: 18px;
  font-weight: bold;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  background: ${({ theme }) => theme.colors.primary[7]};
  color: ${({ theme }) => theme.white};
  overflow: visible;
  white-space: nowrap;

  ::before {
    content: '';
    position: absolute;
    top: -24px;
    right: 2px;
    width: 50px;
    height: 26px;
    background: ${({ theme }) => theme.colors.primary[7]};
    transform: rotate(50deg);
    z-index: 1;
  }

  ::after {
    content: '';
    position: absolute;
    bottom: -24px;
    right: 2px;
    width: 50px;
    height: 26px;
    background: ${({ theme }) => theme.colors.primary[7]};
    transform: rotate(-50deg);
    z-index: 1;
  }
`;

const ToggleLabelText = styled.span`
  position: absolute;
  left: -16px;
  z-index: 2;
`;

const ToggleLabelIcon = styled.span`
  position: absolute;
  left: 5px;
  z-index: 2;
`;

const Tooltip = styled(Paper)`
  @keyframes wiggle {
    from {
      left: 84px;
    }

    to {
      left: 80px;
    }
  }

  animation: 300ms infinite alternate wiggle;

  position: absolute;
  left: 80px;
  padding: 20px;
  z-index: 3;
  background: ${({ theme }) => theme.colors.info[6]};
  border-radius: 2px;
  pointer-events: none;

  ::before {
    content: '';
    position: absolute;
    top: calc(50% - 10px);
    left: -10px;
    width: 20px;
    height: 20px;
    background: ${({ theme }) => theme.colors.info[6]};

    transform: rotate(45deg);
    z-index: -1;
  }
`;

const TooltipText = styled(Text)`
  width: 180px;
  height: 40px;
`;

const TooltipConfirmContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
`;

const TooltipConfirm = styled(UnstyledButton)`
  pointer-events: auto;
  color: ${({ theme }) => theme.white};
  text-decoration: underline;
`;

const DrawerContent = styled.div`
  width: 100%;
  height: 100%;
`;
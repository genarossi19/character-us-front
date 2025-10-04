import React from "react";
import { AnimateIcon } from "../components/animate-ui/icons/icon";
import { BotMessageSquare } from "../components/animate-ui/icons/bot-message-square";

const Test = () => {
  return (
    <AnimateIcon animateOnTap animation="path-loop" completeOnStop>
      <BotMessageSquare className={"h-32 w-32"} />
    </AnimateIcon>
  );
};

export default Test;

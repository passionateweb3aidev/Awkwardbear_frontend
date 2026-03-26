import { colors } from "@/assets/color";
import TaskItem from "./TaskItem";
import { TaskItem as ITaskItem } from "@/services/task";

export default function TasksList({
  className = "",
  taskList,
  handleClickTask,
  giftRewardDetails,
}: {
  className?: string;
  taskList: ITaskItem[];
  giftRewardDetails: {
    criticalImpressionCount: number;
    criticalImpressionPoints: number;
    criticalLikeCount: number;
    criticalLikePoints: number;
    rewardPoints: number;
  };
  handleClickTask: (task: ITaskItem) => void;
}) {
  return (
    taskList.length > 0 && (
      <div
        className={`bg-cyan-100 rounded-t-[24px] p-4 pb-7 ${className}`}
        style={{
          border: `1px solid ${colors.cyan950}`,
          boxShadow: `0px -2px 0px 0px ${colors.cyan950}`,
          borderBottom: "none",
        }}
      >
        {taskList.map((task) => (
          <TaskItem
            key={task.taskCode}
            task={task}
            handleClickTask={handleClickTask}
            giftRewardDetails={giftRewardDetails}
          />
        ))}
      </div>
    )
  );
}

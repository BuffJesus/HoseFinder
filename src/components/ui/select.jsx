import React from "react";

function join(...parts) {
  return parts.filter(Boolean).join(" ");
}

const CHEVRON_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M6 9l6 6 6-6'/></svg>\")";

function flattenItems(node, items = []) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type?.displayName === "SelectItem") {
      items.push({
        value: child.props.value,
        label: child.props.children,
      });
      return;
    }
    if (child.props?.children) flattenItems(child.props.children, items);
  });
  return items;
}

function findTrigger(node) {
  let result = null;
  React.Children.forEach(node, (child) => {
    if (result || !React.isValidElement(child)) return;
    if (child.type?.displayName === "SelectTrigger") {
      result = child;
      return;
    }
    if (child.props?.children) {
      result = findTrigger(child.props.children) || result;
    }
  });
  return result;
}

function findValueProps(node) {
  let result = null;
  React.Children.forEach(node, (child) => {
    if (result || !React.isValidElement(child)) return;
    if (child.type?.displayName === "SelectValue") {
      result = child.props;
      return;
    }
    if (child.props?.children) {
      result = findValueProps(child.props.children) || result;
    }
  });
  return result;
}

export function Select({ value, onValueChange, children }) {
  const trigger = findTrigger(children);
  const triggerClassName = trigger?.props?.className || "";
  const valueProps = findValueProps(children);
  const placeholder = valueProps?.placeholder;
  const items = flattenItems(children);

  return (
    <select
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      style={{
        backgroundImage: CHEVRON_BG,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.85rem center",
        backgroundSize: "12px 12px",
      }}
      className={join(
        "h-11 w-full appearance-none rounded-md border border-zinc-800 px-3.5 py-2 pr-9 outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-zinc-700 focus:border-violet-400/60 focus:bg-white/[0.04] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.18),inset_0_1px_0_rgba(255,255,255,0.04)]",
        triggerClassName,
      )}
    >
      {placeholder && !items.some((item) => item.value === value) && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {items.map((item) => (
        <option key={item.value} value={item.value} className="bg-zinc-900 text-zinc-100">
          {item.label}
        </option>
      ))}
    </select>
  );
}

export function SelectTrigger({ children }) {
  return <>{children}</>;
}
SelectTrigger.displayName = "SelectTrigger";

export function SelectValue() {
  return null;
}
SelectValue.displayName = "SelectValue";

export function SelectContent({ children }) {
  return <>{children}</>;
}
SelectContent.displayName = "SelectContent";

export function SelectItem() {
  return null;
}
SelectItem.displayName = "SelectItem";

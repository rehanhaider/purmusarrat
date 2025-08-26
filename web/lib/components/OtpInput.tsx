import React from "react";

type PartialInputProps = Pick<React.ComponentPropsWithoutRef<"input">, "className" | "style">;

type Props = {
    value: string;
    onChange(value: string): void;
    size?: number;
    validationPattern?: RegExp;
} & PartialInputProps;

const OtpInput = (props: Props) => {
    const { size = 6, validationPattern = /[0-9]{1}/, value, onChange, className, ...restProps } = props;

    const arr = new Array(size).fill("-");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>, index: number) => {
        let val = "";
        let isBackspace = false;

        if (e.type === "keydown") {
            const keydownEvent = e as React.KeyboardEvent<HTMLInputElement>;
            if (keydownEvent.key === "Backspace") {
                isBackspace = true;
            } else {
                return;
            }
        } else {
            const inputEvent = e as React.ChangeEvent<HTMLInputElement>;
            val = inputEvent.target.value;
        }

        if (!validationPattern.test(val) && val !== "") return;

        const valueArr = value.split("");
        if (isBackspace) {
            valueArr[index - 1] = "";
        } else {
            valueArr[index] = val;
        }
        const newVal = valueArr.join("").slice(0, 6);
        onChange(newVal);

        if (val) {
            const next = e.currentTarget.nextElementSibling as HTMLInputElement | null;
            next?.focus();
        } else if (isBackspace) {
            const prev = e.currentTarget.previousElementSibling as HTMLInputElement | null;
            prev?.focus();
        }
    };

    return (
        <div className="flex w-full gap-2">
            {arr.map((_, index) => {
                return (
                    <input
                        key={index}
                        {...restProps}
                        className={`${className || "input input-bordered"} w-full text-center`}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern={validationPattern.source}
                        maxLength={1}
                        value={value.at(index) ?? ""}
                        onChange={(e) => handleInputChange(e, index)}
                        onKeyDown={(e) => handleInputChange(e, index)}
                    />
                );
            })}
        </div>
    );
};

export default OtpInput;

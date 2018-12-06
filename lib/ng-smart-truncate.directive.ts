import {Directive, ElementRef} from '@angular/core';
import {Renderer2} from "@angular/core";
import {Input} from "@angular/core";


enum Direction {
    AddCharacter,
    RemoveCharacter
}

enum Round {
    Floor,
    Ceil
}

@Directive({selector: '[ngSmartTruncate]'})
export class NgSmartTruncateDirective {
    input: string;
    endText = '...';

    constructor(private elementRef: ElementRef,
                private renderer: Renderer2) {
    }

    @Input()
    public set ngSmartTruncate(value: any) {
        this.input = value;
        this.update();
    }

    private update() {
        const element = this.elementRef.nativeElement;
        const parentElement = element.parentElement;
        element.innerHTML = this.input;
        if (!parentElement) {
            return;
        }
        element.innerHTML = this.getContentThatFits(element, parentElement);
    }

    private getContentThatFits(element: HTMLElement, parentElement: HTMLElement) {
        const initialContent = element.innerHTML;

        if (initialContent.length === 0) {
            return initialContent;
        }

        const lineHeight = parseInt(window.getComputedStyle(element, null)['lineHeight'], 10);
        const maxLines = NgSmartTruncateDirective.computeElementLinesNumber(parentElement, lineHeight, Round.Floor);
        if (NgSmartTruncateDirective.alreadyFit(lineHeight, maxLines, element)) {
            return initialContent;
        }

        const helperElement = this.createHelperElement(element, parentElement);
        const contentThatFits = this.getContentThatFits2(helperElement, initialContent, maxLines, lineHeight);
        this.removeHelperElement(helperElement, parentElement);
        return contentThatFits;
    }

    private getContentThatFits2(element: HTMLElement, initialContent: string, maxLines: number, lineHeight: number) {
        const initialLines = NgSmartTruncateDirective.computeElementLinesNumber(element, lineHeight, Round.Ceil);
        const endText = this.endText;
        const endTextLength = this.endText.length;
        const firstGuessIndex = element.innerHTML.length * (maxLines / initialLines) - endTextLength;

        const firstGuessContent = initialContent.slice(0, firstGuessIndex) + endText;
        element.innerHTML = firstGuessContent;
        const firstGuessLines = NgSmartTruncateDirective.computeElementLinesNumber(element, lineHeight, Round.Ceil);

        const direction = firstGuessLines > maxLines ? Direction.RemoveCharacter : Direction.AddCharacter;


        let previousContent = firstGuessContent;
        while (true) {
            const endIndex = previousContent.length + (direction === Direction.AddCharacter ? 1 : -1) - endTextLength;

            if (endIndex < 0 || endIndex > initialContent.length + endTextLength) {
                return initialContent;
            }
            const contentToCheck = initialContent.slice(0, endIndex) + endText;

            element.innerText = contentToCheck;
            const newLines = NgSmartTruncateDirective.computeElementLinesNumber(element, lineHeight, Round.Ceil);

            if (newLines > maxLines && direction === Direction.AddCharacter) {
                return previousContent;
            }
            if (newLines <= maxLines && direction === Direction.RemoveCharacter) {
                return contentToCheck;
            }
            previousContent = contentToCheck;
        }
    }

    private static alreadyFit(lineHeight: number, maxLines: number, element: HTMLElement) {
        const elementLinesNumber = NgSmartTruncateDirective.computeElementLinesNumber(element, lineHeight, Round.Ceil);
        return elementLinesNumber <= maxLines;
    }

    private createHelperElement(elementToClone: HTMLElement, parentElement: HTMLElement): HTMLElement {
        const clonedElement: HTMLElement = elementToClone.cloneNode(true) as HTMLElement;
        this.renderer.appendChild(parentElement, clonedElement);
        return clonedElement;
    }

    private removeHelperElement(element: HTMLElement, parentElement: HTMLElement) {
        this.renderer.removeChild(parentElement, element);
    }

    private static computeElementLinesNumber(element: HTMLElement, lineHeight, round: Round) {
        const elementHeight = element.offsetHeight;
        const lineHeightInPx = parseInt(lineHeight, 10);

        return round === Round.Floor ?
            Math.floor(elementHeight / lineHeightInPx) : Math.ceil(elementHeight / lineHeightInPx);
    }
}

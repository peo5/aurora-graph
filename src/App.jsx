import "./App.css"
import planetPicture from "/planet.png"
import GraphView from "./GraphView"
import CourseCardView from "./CourseCardView"

function App() {
	const nodes = new Map([
		["n1",{code:"MAC0101", name:"Integração na Universidade e na Profissão"}],
		["n2",{code:"MAC0121", name:"Integração na Universidade e na Profissão"}],
		["n3",{code:"MAC0216", name:"Integração na Universidade e na Profissão"}],
		["n4",{code:"MAC0239", name:"Integração na Universidade e na Profissão"}],
		["n5",{code:"MAE0119", name:"Integração na Universidade e na Profissão"}],
		["n6",{code:"MAT2425", name:"Integração na Universidade e na Profissão"}],
	])
	const links = new Map([
		["l1",{a:"n1", b:"n2"}],
		["l2",{a:"n1", b:"n3"}],
		["l3",{a:"n4", b:"n1"}],
		["l4",{a:"n5", b:"n4"}],
		["l5",{a:"n6", b:"n1"}],
		["l6",{a:"n5", b:"n6"}],
	])
	for(const [_,node] of nodes) {
		node.content = (
			<CourseCardView
				code = {node.code}
				name = {node.name}
				picture = {planetPicture}
			/>
		)
	}
	return (
		<GraphView nodes={nodes} links={links} root={"n1"} />
	)
}

export default App
